import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import axios from './configuredAxios.js';

import Home from './views/Home.jsx';
import Login from './views/Login.jsx';
import Signup from './views/Signup.jsx';
import Profile from './views/Profile.jsx';

import ScrapPile from './views/ScrapPile.jsx';
import ViewScrap from './views/ViewScrap.jsx';
import ScratchPad from './views/ScratchPad.jsx';
import BucketList from './views/BucketList.jsx';
import Bucket from './views/Bucket.jsx';
import ContactsList from './views/ContactsList.jsx';

import NavBar from './components/NavBar.jsx';
import Modal from './components/Modal.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 'home',
      viewData: null,
      darkMode: false,
      verifying: true,
      user: null,
      serverDown: false,
    };

    this.setDarkMode = this.setDarkMode.bind(this);
    this.verifySession = this.verifySession.bind(this);
  }

  componentDidMount() {
    this.verifySession();
  }

  async verifySession() {
    await axios.get('/verify')
    .then(({ data }) => {
      this.setState({ user: data, verifying: false });
    })
    .catch(({ response }) => {
      if (response.status === 401) {
        this.setState({ user: null, verifying: false });
      } else {
        this.setState({ serverDown: true });
        console.error(response);
      }
    })
  }

  setDarkMode(darkMode) {
    this.setState({ darkMode });
  }

  render() {
    const { darkMode, user, verifying, serverDown } = this.state;
    const ADDR_PREFIX = window.ADDR_PREFIX;

    const ScrapWrapper = (props) => {
      const params = useParams();
      return <ScratchPad {...{ ...props }} scrapUUID={params.scrapUUID} />;
    };
    
    const BucketWrapper = (props) => {
      const params = useParams();
      return <Bucket {...{ ...props }} bucketUUID={params.bucketUUID} />;
    };

    const ViewScrapWrapper = (props) => {
      const params = useParams();
      return <ViewScrap {...{ ...props }} scrapUUID={params.scrapUUID} />;
    };
    
    return (
      <div className={darkMode ? 'dark' : 'light'}>
        <div className="page">
          <Router>
            <NavBar user={user} />
            {serverDown && (
              <Modal>
                <div className="stack centered">
                  <h2>Unable to Connect to Server</h2>
                  <p>We're having trouble connecting to the server right now. This might be due to a temporary network issue or server maintenance.</p>
                  <p>If the problem does not resolve itself in a few minutes, please let us know at <a href="mailto:contact@hmistudios.com">contact@hmistudios.com</a>.</p>
                  <button className="btn solidBtn fullWidth" onClick={() => location.reload()}>
                    Reload
                  </button>
                </div>
              </Modal>
            )}
            <div className="content">
              {verifying ? null : (
                <Routes>
                  <Route path={`${ADDR_PREFIX}`} element={
                    <Navigate to="pile" />
                  } />
                  <Route path={`${ADDR_PREFIX}/home/*`} element={
                    <Home />
                  } />
                  <Route path={`${ADDR_PREFIX}/profile`} element={
                    <Profile
                      verifySession={this.verifySession}
                      user={user}
                      setDarkMode={this.setDarkMode}
                      darkMode={darkMode}
                    />
                  } />
                  <Route path={`${ADDR_PREFIX}/login`} element={
                    <Login verifySession={this.verifySession} />
                  } />
                  <Route path={`${ADDR_PREFIX}/signup`} element={
                    <Signup verifySession={this.verifySession} />
                  } />
                  <Route path={`${ADDR_PREFIX}/pile`} element={
                    <ScrapPile user={user} />
                  } />
                  <Route path={`${ADDR_PREFIX}/scratchpad`} element={
                    <ScratchPad user={user} />
                  } />
                  <Route path={`${ADDR_PREFIX}/scratchpad/:scrapUUID`} element={
                    <ScrapWrapper user={user} />
                  } />
                  <Route path={`${ADDR_PREFIX}/scraps/:scrapUUID`} element={
                    <ViewScrapWrapper user={user} />
                  } />
                  <Route path={`${ADDR_PREFIX}/buckets`} element={
                    <BucketList />
                  } />
                  <Route path={`${ADDR_PREFIX}/buckets/:bucketUUID/*`} element={
                    <BucketWrapper user={user} />
                  } />
                  <Route path={`${ADDR_PREFIX}/contacts/*`} element={
                    <ContactsList user={user} />
                  } />
                </Routes>
              )}
            </div>
          </Router>
        </div>
      </div>
    );
  }
}

export default App;

{/* {view === 'home' && <Home />}
    {view === 'profile' && (
      <Profile
       
        verifySession={this.verifySession}
        user={user}
        setDarkMode={this.setDarkMode}
        darkMode={darkMode}
      />
    )}
    {view === 'login' && <Login verifySession={this.verifySession} />}
    {view === 'signup' && <Signup verifySession={this.verifySession} />}
    {view === 'budgets' && <BudgetsList />}
    {view === 'envelopes' && <EnvelopeList />}
    {view === 'expenses' && <ExpensesList envelopeId={viewData} />}
    {view === 'income' && <IncomeList />}
    {view === 'savingsenvelopes' && <SavingsList />}
    {view === 'budget' && <Budget user={user} budgetId={viewData} />}
    {view === 'envelope' && <Envelope user={user} envelopeId={viewData} />}
    {view === 'savings' && <SavingsEnvelope envelopeId={viewData} />}
    {view === 'contacts' && <ContactsList user={user} envelopeId={viewData} />} */}