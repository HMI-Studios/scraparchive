import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from '../configuredAxios.js';

import PageTitle from '../components/PageTitle.jsx';
import InputForm from '../components/InputForm.jsx';
import Markdown from 'react-markdown'

class ViewScrap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrap: null,
      body: '\t',
      redirect: null,
    };
    this.fetchScrap = this.fetchScrap.bind(this);
    this.nextScrap = this.nextScrap.bind(this);
  }

  componentDidMount() {
    if (this.props.scrapUUID) {
      this.fetchScrap();
    } else {
      const localScrap = localStorage.getItem('scrap');
      if (localScrap) {
        this.setState({ body: localScrap });
      }
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

  async fetchScrap() {
    const { data: scrap } = await axios.get(`/api/scraps/${this.props.scrapUUID}`);
    localStorage.removeItem('scrap');
    this.setState({ scrap, body: scrap.body });
  }

  async nextScrap({ next }) {
    const { scrapUUID, user } = this.props;
    if (user.default_next && !next) user.default_next;
    if (next && next !== user.default_next) await axios.put(`/api/users/${user.id}`, { default_next: next });
    const { data: scraps } = await axios.get(`/api/scraps/next?sort=${next}&limit=2`);
    const [scrap, alt] = scraps;
    if (scrap && scrap.uuid !== scrapUUID) this.setState({ redirect: `scraps/${scrap.uuid}` });
    else if (alt && alt.uuid !== scrapUUID) this.setState({ redirect: `scratchpad/${alt.uuid}` });
    // else TODO error?
  }

  render() {
    const { scrapUUID } = this.props;
    const { scrap, body, redirect } = this.state;

    return (
      <>
        {redirect !== null && <Navigate to={`${window.ADDR_PREFIX}/${redirect}`} />}
        {((!scrapUUID || scrap) && <div>
          <PageTitle title={scrap.title ?? 'Untitled Scrap'} />
          <div className="row stack">
            <div className='markdown' style={{width: '80%'}}><Markdown>{body}</Markdown></div>
            <div className="stack">
              <Link className="btn solidBtn" to={`${window.ADDR_PREFIX}/scratchpad/${scrap.uuid}`}>Edit</Link>
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
          </div>
        </div>)}
      </>
    );
  }
}

export default ViewScrap;