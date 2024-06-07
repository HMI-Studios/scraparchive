import React from 'react';
import axios from 'axios';
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
    this.fetchBucket = this.fetchBucket.bind(this);
    this.fetchScraps = this.fetchScraps.bind(this);
    this.fetchChildBuckets = this.fetchChildBuckets.bind(this);
    this.fetchContacts = this.fetchContacts.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.changeUserPermissions = this.changeUserPermissions.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps, _) {
    if (this.props.bucketID !== prevProps.bucketID) {
      this.fetchData();
    }
  }

  async fetchData() {
    // await these?
    this.fetchBucket();
    this.fetchScraps();
    this.fetchChildBuckets();
    this.fetchContacts();
  }

  async fetchBucket() {
    const { bucketID } = this.props;
    const { data: bucket } = await axios.get(`${window.ADDR_PREFIX}/api/buckets/${bucketID}`);
    console.log(bucket)
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
      }[row.permissionLvl],
    }));
    this.setState({ bucket });
  }

  async fetchScraps() {
    const { bucketID } = this.props;
    const { data: scraps } = await axios.get(`${window.ADDR_PREFIX}/api/buckets/${bucketID}/scraps`);
    console.log(scraps)
    // scraps = scraps.map(row => ({
    //   ...row,
    //   posted_on: new Date(row.posted_on),
    //   column: row.column || '',
    // }));
    this.setState({ scraps });
  }

  async fetchChildBuckets() {
    const { bucketID } = this.props;
    const { data: income } = await axios.get(`${window.ADDR_PREFIX}/api/buckets/${bucketID}/children`)
    // const income = data.map(row => ({...row, posted_on: new Date(row.posted_on)}));
    this.setState({ income });
  }

  async fetchContacts() {
    const { user } = this.props;
    if (user) {
      const contacts = {};
      const { data } = await axios.get(`${window.ADDR_PREFIX}/api/contacts`);
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

  async changeUserPermissions({ user_id, permissionLvl, recursive }) {
    const { bucketID } = this.props;
    await axios.put(`${window.ADDR_PREFIX}/api/buckets/permissions`, {
      user_id,
      bucket_id: bucketID,
      permissionLvl,
      recursive,
    });
    this.fetchBucket();
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
    const { bucketID } = this.props;
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
            <EnhancedTable key={'scraps'} refresh={this.fetchScraps} columns={scrapColumns} rows={scraps} defaultSort={'earthdate'} />
          </div>
        ),
      },
      children: {
        displayName: 'Child Buckets',
        content: (
          <div className="stack">
            <EnhancedTable key={'children'} refresh={this.fetchChildBuckets} columns={childBucketColumns} rows={children} defaultSort={'title'} />
          </div>
        ),
      },
      users: {
        displayName: 'Users',
        content: (
          <div className="stack">
            <EnhancedTable key={'users'} refresh={this.fetchBucket} columns={permColumns} rows={bucket.perms || []} defaultSort={'user_name'} />
            <TextBtn onClick={() => this.setState({ showEntryForm: !showEntryForm })}>Change user permissions</TextBtn>
            {showEntryForm && (
              <InputForm submitFn={this.changeUserPermissions} fields={{
                user_id: 'User',
                permissionLvl: 'Permission Level',
                recursive: 'Apply to all children',
              }} required={{
                user_id: true,
                permissionLvl: true,
              }} types={{
                user_id: 'select',
                permissionLvl: 'select',
                recursive: 'select',
              }} dropdownOptions={{
                user_id: contacts,
                permissionLvl: {
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