import React from 'react';
import axios from 'axios';

import PageTitle from '../components/PageTitle.jsx';
import EnhancedTable from '../components/EnhancedTable.jsx';
import InputForm from '../components/InputForm.jsx';
import TextBtn from '../components/buttons/TextBtn.jsx';

const scrapColumns = [
  {
    id: 'title',
    numeric: false,
    label: 'Bucket Title',
  },
  {
    id: 'bucket',
    numeric: false,
    label: 'Bucket',
  },
  {
    id: 'earthdate',
    numeric: true,
    label: 'Date',
  },
  {
    id: 'earthtime',
    numeric: false,
    label: 'Time',
  },
  {
    id: 'canon_status',
    numeric: false,
    label: 'Canon Status',
  },
  {
    id: 'author',
    numeric: false,
    label: 'Written By',
  },
]

class BucketList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buckets: [],
      scraps: [],
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
    let { data: scraps } = await axios.get(`${window.ADDR_PREFIX}/api/scraps`);
    scraps = scraps.map(row => ({
      ...row,
      title: row.title || '[Untitled]',
    }));
    this.setState({ buckets, scraps });
  }

  submitEntry(data) {
    axios.post(`${window.ADDR_PREFIX}/api/buckets`, data)
    .then(() => {
      this.fetchData();
    })
  }

  render() {
    const { buckets, scraps, showEntryForm } = this.state;

    return (
      <>
        <PageTitle title={'Scrap Pile'} />
        <div className="stack">
          {/* <TextBtn onClick={() => this.setState({ showEntryForm: !showEntryForm })}>New Bucket</TextBtn>
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
          )} */}
          <EnhancedTable refresh={this.fetchData} columns={scrapColumns} rows={scraps} defaultSort={'title'} links={{
            title: (row) => (`/scratchpad/${row.id}`)
          }} />
        </div>
      </>
    );
  }
}

export default BucketList;