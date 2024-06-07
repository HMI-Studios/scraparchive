import React from 'react';
import axios from 'axios';

import PageTitle from '../components/PageTitle.jsx';
import InputForm from '../components/InputForm.jsx';
import TextArea from '../components/TextArea.jsx';

class ScratchPad extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buckets: [],
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
    const buckets = [];
    this.setState({ buckets });
  }

  submitEntry(data) {
    console.log(data);
    axios.post(`${window.ADDR_PREFIX}/api/income`, data)
    .then(() => {
      this.fetchData();
    })
  }

  render() {
    const { buckets } = this.state;

    const now = new Date();
    const localDate = new Date((now - (now.getTimezoneOffset() * 60000)));
    const dateString = localDate.toISOString().slice(0, -8);

    return (
      <>
        <PageTitle title={'Scratchpad'} />
        <div className="row stack">
          <TextArea />
          <div className="stack">
            <InputForm submitFn={this.submitEntry} fields={{
              title: 'Title',
              bucket: 'Bucket',
              earthdate: 'Start Date',
              earthtime: 'Start Time',
              canon: 'Canon Status',
            }} required={{
            }} types={{
              bucket: 'select',
              earthdate: 'number',
              earthtime: 'time',
              canon: 'select',
            }} defaults={{
            }} dropdownOptions={{
              bucket: buckets,
              canon: {
                0: 'Not Canon',
                1: 'Headcanon',
                2: 'Potential Canon',
                3: 'Mostly Canon',
                4: 'Canon Draft',
                5: 'Confirmed Canon',
              },
            }}/>
          </div>
        </div>
      </>
    );
  }
}

export default ScratchPad;