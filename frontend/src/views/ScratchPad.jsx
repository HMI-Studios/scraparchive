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

    if (this.props.scrapID) {
      this.fetchScrap();
    }
  }

  async fetchData() {
    const { data } = await axios.get(`${window.ADDR_PREFIX}/api/buckets`);
    const buckets = {};
    data.map(bucket => {
      buckets[bucket.id] = bucket.title;
    })
    this.setState({ buckets });
  }

  async fetchScrap() {
    const { data: scrap } = await axios.get(`${window.ADDR_PREFIX}/api/scraps/${this.props.scrapID}`);
    this.setState({ scrap, body: scrap.body });
  }

  async nextScrap({ next }) {
    const { data: scrapID } = await axios.get(`${window.ADDR_PREFIX}/api/scraps/next?sort=${next}`);
    this.setState({ redirect: `/scratchpad/${scrapID}` });
  }

  submitEntry(data) {
    const { scrapID } = this.props;
    const { body } = this.state;
    if (scrapID) {
      axios.put(`${window.ADDR_PREFIX}/api/scraps/${scrapID}`, {
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
        this.setState({ redirect: `/scratchpad/${data.insertId}` });
      })
    }
  }

  render() {
    const { scrapID } = this.props;
    const { buckets, scrap, body, redirect } = this.state;

    const defaults = scrapID ? scrap : {};

    return (
      <>
        <PageTitle title={'Scratchpad'} />
        {redirect !== null && <Navigate to={`${window.ADDR_PREFIX}${redirect}`} />}
        {((buckets && (!scrapID || scrap)) && <div className="row stack">
          <TextArea value={body} onChange={(body) => this.setState({ body })} />
          <div className="stack">
            <InputForm submitFn={this.submitEntry} submitText={scrapID && 'Save'} fields={{
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
                // 'last_updated_asc': 'Least Recently Updated',
                // 'last_updated_desc': 'Most Recently Updated',
                // 'least_info': 'Least Info',
                'random': 'Random',
              },
            }}/>
          </div>
        </div>)}
      </>
    );
  }
}

export default ScratchPad;