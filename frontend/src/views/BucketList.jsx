import React from 'react';
import axios from 'axios';

import PageTitle from '../components/PageTitle.jsx';
import EnhancedTable from '../components/EnhancedTable.jsx';
import InputForm from '../components/InputForm.jsx';
import TextBtn from '../components/buttons/TextBtn.jsx';

const bucketColumns = [
  {
    id: 'title',
    numeric: false,
    label: 'Bucket Title',
  },
  {
    id: 'parent_title',
    numeric: false,
    label: 'Parent Bucket',
  },
  {
    id: 'scrap_count',
    numeric: true,
    label: 'Scraps',
  },
]

class BucketList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buckets: [],
      showEntryForm: false,
    };
    this.fetchData = this.fetchData.bind(this);
    this.submitEntry = this.submitEntry.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    let { data: buckets } = await axios.get(`${window.ADDR_PREFIX}/api/buckets`);
    buckets = buckets.map(row => ({
      ...row,
    }));
    this.setState({ buckets });
  }

  submitEntry(data) {
    axios.post(`${window.ADDR_PREFIX}/api/buckets`, data)
    .then(() => {
      this.fetchData();
    })
  }

  render() {
    const { buckets, showEntryForm } = this.state;

    const now = new Date();
    const localDate = new Date((now - (now.getTimezoneOffset() * 60000)));
    const dateString = localDate.toISOString().slice(0, -8);

    return (
      <>
        <PageTitle title={'Buckets'} />
        <div className="stack">
          <EnhancedTable refresh={this.fetchData} columns={bucketColumns} rows={buckets} defaultSort={'title'} links={{
            title: (row) => (`/buckets/${row.id}`)
          }} />
          <TextBtn onClick={() => this.setState({ showEntryForm: !showEntryForm })}>New Bucket</TextBtn>
          {showEntryForm && (
            <InputForm submitFn={this.submitEntry} fields={{
              title: 'Title',
              bucket_id: 'Parent Bucket',
            }} required={{
              title: true,
            }} types={{
              bucket_id: 'dynamicselect',
            }} dynamicDropdownOptions={{
              bucket_id: () => buckets.map(row => ({ value: row.id, label: row.title })),
            }} />
          )}
        </div>
      </>
    );
  }
}

export default BucketList;