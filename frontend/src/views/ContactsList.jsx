import React from 'react';
import axios from '../configuredAxios.js';

import PageTitle from '../components/PageTitle.jsx';
import InputForm from '../components/InputForm.jsx';
import TabGroup from '../components/TabGroup.jsx';
import SolidBtn from '../components/buttons/SolidBtn.jsx';
import TextBtn from '../components/buttons/TextBtn.jsx';

class ContactsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contacts: [],
      pending: [],
      showContactForm: false,
    };
    this.submitContact = this.submitContact.bind(this);
    this.acceptContact = this.acceptContact.bind(this);
    this.rejectContact = this.rejectContact.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    let { data: contacts } = await axios.get('/api/contacts');
    let { data: pending } = await axios.get('/api/contacts/pending');
    this.setState({ contacts, pending });
  }

  async submitContact({ email }) {
    await axios.post('/api/contacts', { email });
    this.fetchData();
  }

  async acceptContact(contactId) {
    await axios.put(`/api/contacts/${contactId}`);
    this.fetchData();
  }

  async rejectContact(contactId) {
    await axios.delete(`/api/contacts/${contactId}`);
    this.fetchData();
  }

  render() {
    const { user,setView } = this.props;
    const { contacts, pending, showContactForm } = this.state;

    const refreshBtn = (
      <TextBtn onClick={() => this.fetchData()}>Refresh</TextBtn>
    );

    const contactCount = user && contacts && contacts.length;

    const incomingRequestCount = user && pending && pending.length;

    const tabs = {
      all: {
        displayName: `All (${contactCount || 0})`,
        content: (
          <>
            {refreshBtn}
            {user && contacts && contacts.map(contact => {
              if (contact.user_id === user.id) {
                return (
                  <div key={contact.contact_email} className="contactTile">
                      <img src={contact.gravatar_link + '?s=64'} />
                    <div className="contactTile inner">
                      <h2 style={{ 'margin': 0 }}>{contact.contact_name}</h2>
                      <span>{contact.contact_email}</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={contact.user_email} className="contactTile">
                    <img src={contact.gravatar_link + '?s=64'} />
                    <div className="contactTile inner">
                      <h2 style={{ 'margin': 0 }}>{contact.user_name}</h2>
                      <span>{contact.user_email}</span>
                    </div>
                  </div>
                );
              }
            })}
          </>
        ),
      },
      pending: {
        displayName: `Pending${incomingRequestCount ? ` (${incomingRequestCount})` : ''}`,
        content: (
          <>
            {refreshBtn}
            {user && pending && pending.map(contact => {
              if (contact.user_id === user.id) {
                return (
                  <div key={contact.contact_email} className="contactTile">
                    <img src={contact.gravatar_link + '?s=64'} />
                    <div className="contactTile inner">
                      <h2 style={{ 'margin': 0 }}>{contact.contact_name}</h2>
                      <span>{contact.contact_email}</span>
                      <span style={{ flexGrow: 1, textAlign: 'end' }}>Pending</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={contact.user_email} className="contactTile">
                    <img src={contact.gravatar_link + '?s=64'} />
                    <div className="contactTile inner">
                      <h2 style={{ 'margin': 0 }}>{contact.user_name}</h2>
                      <span>{contact.user_email}</span>
                      <SolidBtn style={{'marginLeft': 'auto'}} onClick={() => this.acceptContact(contact.user_id)}>Accept</SolidBtn>
                      <SolidBtn className="errorBtn" onClick={() => this.rejectContact(contact.user_id)}>Reject</SolidBtn>
                    </div>
                  </div>
                );
              }
            })}
          </>
        ),
      },
      add: {
        displayName: 'Add Contact',
        content: (
          <>
            {refreshBtn}
            <InputForm color="paper" submitFn={this.submitContact} fields={{
              email: 'E-Mail',
            }} required={{
              email: true,
            }} types={{
              email: 'email',
            }} />
          </>
        ),
      },
    };

    return (
      <>
        <PageTitle title={'Contacts'} />
        <div className="paper" >
          <TabGroup tabs={tabs} defaultTab="all" />
        </div>
      </>
    );
  }
}

export default ContactsList;