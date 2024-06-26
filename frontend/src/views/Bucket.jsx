import React from 'react';
import axios from '../configuredAxios.js';
import { Link } from 'react-router-dom';

import PageTitle from '../components/PageTitle.jsx';
import InputForm from '../components/InputForm.jsx';
import TabGroup from '../components/TabGroup.jsx';
import EnhancedTable from '../components/EnhancedTable.jsx';
import Alert from '../components/Alert.jsx';
import TextBtn from '../components/buttons/TextBtn.jsx';

const scrapColumns = [
  {
    id: 'title',
    numeric: false,
    label: 'Title',
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
];

const childBucketColumns = [
  {
    id: 'title',
    numeric: false,
    label: 'Title',
  },
  {
    id: 'scrap_count',
    numeric: true,
    label: 'Scraps',
  },
];

const permColumns = [
  {
      id: 'user_name',
      numeric: false,
      label: 'User Name',
  },
  {
      id: 'email',
      numeric: false,
      label: 'Email',
  },
  {
      id: 'permissionTitle',
      numeric: false,
      label: 'Permission Level',
  },
];

class Bucket extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bucket: {},
      children: [],
      scraps: [],
      contacts: {},
      showEntryForm: false,
      editMode: false,
      showPercentAlert: false,
      alertCallback: () => {},
    };
    this.fetchData = this.fetchData.bind(this);
    this.fetchBucketScraps = this.fetchBucketScraps.bind(this);
    this.fetchChildBuckets = this.fetchChildBuckets.bind(this);
    this.fetchContacts = this.fetchContacts.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.changeUserPermissions = this.changeUserPermissions.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps, _) {
    if (this.props.bucketUUID !== prevProps.bucketUUID) {
      this.fetchData();
    }
  }

  async fetchData() {
    // await these?
    this.fetchBucketScraps();
    this.fetchChildBuckets();
    this.fetchContacts();
  }

  async fetchBucketScraps() {
    const { bucketUUID } = this.props;
    const { data } = await axios.get(`/api/buckets/${bucketUUID}/scraps`);
    const { bucket, scraps } = data;
    bucket.perms = bucket.perms.map(row => ({
      ...row,
      id: row.user_id,
      permissionTitle: {
        0: 'No Access',
        1: 'Read Access',
        2: 'Read/Comment',
        3: 'Write Access',
        4: 'Write/Delete',
        5: 'Admin',
      }[row.permissions_lvl],
    }));
    this.setState({ bucket, scraps });
  }

  async fetchChildBuckets() {
    const { bucketUUID } = this.props;
    const { data: children } = await axios.get(`/api/buckets/${bucketUUID}/children`)
    console.log(children)
    // const income = data.map(row => ({...row, posted_on: new Date(row.posted_on)}));
    this.setState({ children });
  }

  async fetchContacts() {
    const { user } = this.props;
    if (user) {
      const contacts = {};
      const { data } = await axios.get('/api/contacts');
      data.map(contact => {
        if (contact.user_id === user.id) contacts[contact.contact_id] = contact.contact_name;
        else contacts[contact.user_id] = contact.user_name; 
      });
      this.setState({ contacts });
    }
  }

  async toggleEdit() {
    const { editMode } = this.state;
    await this.fetchData();
    this.setState({ editMode: !editMode });
  }

  async changeUserPermissions({ user_id, permissions_lvl, recursive }) {
    const { bucketUUID } = this.props;
    await axios.put('/api/buckets/permissions', {
      user_id,
      bucket_id: bucketUUID,
      permissions_lvl,
      recursive,
    });
    this.fetchBucketScraps();
  }
  
  editAlloc(index, newAlloc) {
    const { savingsGoals } = this.state;
    const newGoals = [ ...savingsGoals ];
    const oldAlloc = newGoals[index].alloc_pr;
    newGoals[index].alloc_pr = newAlloc;

    const totalSavingsAlloc = newGoals.map(goal => Number(goal.alloc_pr)).reduce((a, x) => a + x, 0);
    if (totalSavingsAlloc > 100) {
      newAlloc -= totalSavingsAlloc - 100;
      newGoals[index].alloc_pr = newAlloc;
    }

    this.setState({ savingsGoals: newGoals });
  }

  async showValidationAlert() {
    await new Promise((resolve, reject) => {
      this.setState({ showPercentAlert: true, alertCallback: resolve });
    });
  }

  render() {
    const { bucketUUID } = this.props;
    const { 
      bucket, children, scraps, contacts,
      showEntryForm,
      editMode,
      showPercentAlert,
      alertCallback
    } = this.state;

    const tabs = {
      scraps: {
        displayName: 'Scraps',
        content: (
          <div className="stack">
            <EnhancedTable key={'scraps'} refresh={this.fetchBucketScraps} columns={scrapColumns} rows={scraps} defaultSort={'earthdate'} links={{
            title: (row) => (`/scratchpad/${row.uuid}`)
          }} />
          </div>
        ),
      },
      children: {
        displayName: 'Child Buckets',
        content: (
          <div className="stack">
            <EnhancedTable key={'children'} refresh={this.fetchChildBuckets} columns={childBucketColumns} rows={children} defaultSort={'title'} links={{
            title: (row) => (`/buckets/${row.uuid}`)
          }} />
          </div>
        ),
      },
      users: {
        displayName: 'Users',
        content: (
          <div className="stack">
            <EnhancedTable key={'users'} refresh={this.fetchBucketScraps} columns={permColumns} rows={bucket.perms || []} defaultSort={'user_name'} />
            <TextBtn onClick={() => this.setState({ showEntryForm: !showEntryForm })}>Change user permissions</TextBtn>
            {showEntryForm && (
              <InputForm submitFn={this.changeUserPermissions} fields={{
                user_id: 'User',
                permissions_lvl: 'Permission Level',
                recursive: 'Apply to all children',
              }} required={{
                user_id: true,
                permissions_lvl: true,
              }} types={{
                user_id: 'select',
                permissions_lvl: 'select',
                recursive: 'select',
              }} dropdownOptions={{
                user_id: contacts,
                permissions_lvl: {
                  0: 'No Access',
                  1: 'Read Access',
                  2: 'Read/Comment',
                  3: 'Write Access',
                  4: 'Write/Delete',
                },
                recursive: { 1: 'Yes', 0: 'No' },
              }} />
            )}
          </div>
        ),
      },
    };

    return bucket ? (
      <>
        <PageTitle title={bucket.title} />
        {bucket.bucket_id !== null && (<div className="centered">
          <h3>Parent Bucket: <Link className="tableLink" to={`${window.ADDR_PREFIX}/buckets/${bucket.bucket_id}`}>{bucket.parent_title}</Link></h3>
        </div>)}
        <TabGroup tabs={tabs} />
      </>
    ) : null;
  }
}

export default Bucket;