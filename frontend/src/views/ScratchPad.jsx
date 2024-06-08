import React from 'react';
import axios from 'axios';

import PageTitle from '../components/PageTitle.jsx';
import InputForm from '../components/InputForm.jsx';
import TextArea from '../components/TextArea.jsx';

class ScratchPad extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buckets: null,
      body: '\t',
    };
    this.fetchData = this.fetchData.bind(this);
    this.submitEntry = this.submitEntry.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    const { data } = await axios.get(`${window.ADDR_PREFIX}/api/buckets`);
    console.log(data);
    const buckets = {};
    data.map(bucket => {
      buckets[bucket.id] = bucket.title;
    })
    this.setState({ buckets });
  }

  submitEntry(data) {
    const { body } = this.state;
    axios.post(`${window.ADDR_PREFIX}/api/scraps`, {
      ...data,
      body,
    })
    .then(() => {
      this.fetchData();
    })
  }

  render() {
    const { buckets, body } = this.state;

    const now = new Date();
    const localDate = new Date((now - (now.getTimezoneOffset() * 60000)));
    const dateString = localDate.toISOString().slice(0, -8);

    return (
      <>
        <PageTitle title={'Scratchpad'} />
        {(buckets && <div className="row stack">
          <TextArea value={body} onChange={(body) => this.setState({ body })} />
          <div className="stack">
            <InputForm submitFn={this.submitEntry} fields={{
              title: 'Title',
              bucket_id: 'Bucket',
              earthdate: 'Start Date',
              earthtime: 'Start Time',
              canon_status: 'Canon Status',
            }} types={{
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
          </div>
        </div>)}
      </>
    );
  }
}

export default ScratchPad;