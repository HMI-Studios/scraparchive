import React from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

import PageTitle from '../components/PageTitle.jsx';
import InputForm from '../components/InputForm.jsx';
import TextArea from '../components/TextArea.jsx';

class ScratchPad extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buckets: null,
      scrap: null,
      body: '\t',
      redirect: null,
    };
    this.fetchData = this.fetchData.bind(this);
    this.fetchScrap = this.fetchScrap.bind(this);
    this.nextScrap = this.nextScrap.bind(this);
    this.submitEntry = this.submitEntry.bind(this);
  }

  componentDidMount() {
    this.fetchData();

    if (this.props.scrapUUID) {
      this.fetchScrap();
    }
  }

  componentDidUpdate(prevProps, _) {
    if (prevProps.scrapUUID !== this.props.scrapUUID) {
      this.setState({ scrap: null, redirect: null });

      if (this.props.scrapUUID) {
        this.fetchScrap();
      }
    }
  }

  async fetchData() {
    const { data } = await axios.get(`${window.ADDR_PREFIX}/api/buckets`);
    const buckets = {};
    data.map(bucket => {
      buckets[bucket.id] = bucket.title + (bucket.parent_title ? ` (${bucket.parent_title})` : '');
    })
    this.setState({ buckets });
  }

  async fetchScrap() {
    const { data: scrap } = await axios.get(`${window.ADDR_PREFIX}/api/scraps/${this.props.scrapUUID}`);
    this.setState({ scrap, body: scrap.body });
  }

  async nextScrap({ next }) {
    const { scrapUUID, user } = this.props;
    if (user.default_next && !next) user.default_next;
    if (next && next !== user.default_next) await axios.put(`${window.ADDR_PREFIX}/api/users/${user.id}`, { default_next: next });
    const { data: scraps } = await axios.get(`${window.ADDR_PREFIX}/api/scraps/next?sort=${next}&limit=2`);
    const [scrap, alt] = scraps;
    if (scrap && scrap.uuid !== scrapUUID) this.setState({ redirect: `/scratchpad/${scrap.uuid}` });
    else if (alt && alt.uuid !== scrapUUID) this.setState({ redirect: `/scratchpad/${alt.uuid}` });
    // else TODO error?
  }

  submitEntry(data) {
    const { scrapUUID } = this.props;
    const { body } = this.state;
    if (scrapUUID) {
      axios.put(`${window.ADDR_PREFIX}/api/scraps/${scrapUUID}`, {
        ...data,
        body,
      })
      .then(() => {
        // this.setState({ scrap: null })
        this.fetchData();
        this.fetchScrap();
      })
    } else {
      axios.post(`${window.ADDR_PREFIX}/api/scraps`, {
        ...data,
        body,
      })
      .then(({ data }) => {
        this.setState({ scrap: null, body: '\t' });
        this.fetchData();
        // this.setState({ redirect: `/scratchpad/${data.insertId}` });
      })
    }
  }

  render() {
    const { scrapUUID } = this.props;
    const { buckets, scrap, body, redirect } = this.state;

    const defaults = scrapUUID ? scrap : {};

    return (
      <>
        <PageTitle title={'Scratchpad'} />
        {redirect !== null && <Navigate to={`${window.ADDR_PREFIX}${redirect}`} />}
        {((buckets && (!scrapUUID || scrap)) && <div className="row stack">
          <TextArea value={body} onChange={(body) => this.setState({ body })} />
          <div className="stack">
            <InputForm submitFn={this.submitEntry} submitText={scrapUUID && 'Save'} fields={{
              title: 'Title',
              bucket_id: 'Bucket',
              earthdate: 'Start Date',
              earthtime: 'Start Time',
              canon_status: 'Canon Status',
            }} defaults={
              defaults
            } types={{
              bucket_id: 'select',
              earthdate: 'number',
              earthtime: 'time',
              canon_status: 'select',
            }} dropdownOptions={{
              bucket_id: buckets,
              canon_status: {
                0: 'Not Canon',
                1: 'Headcanon',
                2: 'Potential Canon',
                3: 'Mostly Canon',
                4: 'Canon Draft',
                5: 'Confirmed Canon',
              },
            }}/>
            <hr style={{ width: '100%' }} />
            <InputForm submitFn={this.nextScrap} submitText={'Next'} fields={{
              next: 'Next scrap in pile',
            }} types={{
              next: 'select',
            }} dropdownOptions={{
              next: {
                'random': 'Random',
                'least_info': 'Least Info',
                'last_update_asc': 'Least Recently Updated',
                'last_update_desc': 'Most Recently Updated',
              },
            }}/>
          </div>
        </div>)}
      </>
    );
  }
}

export default ScratchPad;