import React from 'react';
import axios from '../configuredAxios.js';

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
  {
    id: 'updated_at',
    numeric: false,
    isDate: true,
    isTime: true,
    label: 'Last Updated',
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
    this.updateSort = this.updateSort.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    let { data: buckets } = await axios.get('/api/buckets');
    let { data: scraps } = await axios.get('/api/scraps/next');
    scraps = scraps.map(row => ({
      ...row,
      title: row.title || '[Untitled]',
      created_at: row.created_at && new Date(row.created_at),
      updated_at: row.updated_at && new Date(row.updated_at),
    }));
    this.setState({ buckets, scraps });
  }

  updateSort({ next }) {
    const { user } = this.props;
    axios.put(`/api/users/${user.id}`, { default_next: next })
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
          <TextBtn onClick={() => this.setState({ showEntryForm: !showEntryForm })}>Update Sort Order</TextBtn>
          {showEntryForm && (
            <InputForm submitFn={this.updateSort} submitText={'Update'} fields={{
              next: 'Sort Order',
            }} required={{
              next: true,
            }} types={{
              next: 'select',
            }} dropdownOptions={{
              next: {
                'random': 'Random',
                'least_info': 'Least Info',
                'last_update_asc': 'Least Recently Updated',
                'last_update_desc': 'Most Recently Updated',
              },
            }} />
          )}
          <EnhancedTable refresh={this.fetchData} columns={scrapColumns} rows={scraps} links={{
            title: (row) => (`/scratchpad/${row.uuid}`)
          }} />
        </div>
      </>
    );
  }
}

export default BucketList;