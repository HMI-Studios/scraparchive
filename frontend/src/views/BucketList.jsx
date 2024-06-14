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
    let { data: buckets } = await axios.get(`${window.API_URL}/api/buckets`);
    buckets = buckets.map(row => ({
      ...row,
    }));
    this.setState({ buckets });
  }

  submitEntry({ title, bucket_id, copyParent }) {
    const entry = {
      title,
      bucket_id,
    };
    axios.post(`${window.API_URL}/api/buckets`, entry)
    .then(({ data }) => {
      const newID = data[0].insertId;
      if (newID && copyParent) {
        axios.get(`${window.API_URL}/api/buckets/${bucket_id}`)
        .then(({ data: bucket }) => {
          console.log(bucket)
          for (const row of bucket.perms) {
            axios.put(`${window.API_URL}/api/buckets/permissions`, {
              user_id: row.user_id,
              bucket_id: newID,
              permissions_lvl: row.permissions_lvl,
              recursive: false,
            });
          }
        })
        .then(() => {
          this.fetchData();
        })
      } else {
        this.fetchData();
      }
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
            title: (row) => (`/buckets/${row.uuid}`)
          }} />
          <TextBtn onClick={() => this.setState({ showEntryForm: !showEntryForm })}>New Bucket</TextBtn>
          {showEntryForm && (
            <InputForm submitFn={this.submitEntry} fields={{
              title: 'Title',
              bucket_id: 'Parent Bucket',
              copyParent: 'Copy parent permissions',
            }} required={{
              title: true,
            }} types={{
              bucket_id: 'dynamicselect',
              copyParent: 'select',
            }} dynamicDropdownOptions={{
              bucket_id: () => buckets.map(row => ({ value: row.id, label: row.title })),
            }} dropdownOptions={{
              copyParent: {
                1: 'Yes',
                0: 'No',
              },
            }} />
          )}
        </div>
      </>
    );
  }
}

export default BucketList;