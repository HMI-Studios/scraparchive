import React from 'react';
import { Link } from 'react-router-dom';
import axios from '../configuredAxios.js';

import PageTitle from '../components/PageTitle.jsx';
import TabGroup from '../components/TabGroup.jsx';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: null,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    let { data: balance } = await axios.get('/api/balance');
    this.setState({ balance });
  }

  render() {
    const { setView } = this.props;
    const { balance } = this.state;
    const ADDR_PREFIX = window.ADDR_PREFIX;

    const tabs = {
      summary: {
        displayName: 'Summary',
        content: (
          <div className="stack" >
            <h2 className="centered">Tab 1</h2>
          </div>
        ),
      },
      pages: {
        displayName: 'Pages',
        content: (
          <div className="stack" >
            <Link className="btn solidBtn halfWidth" to={`${ADDR_PREFIX}/budgets`}>Link</Link>
          </div>
        ),
      },
    };

    return (
      <>
        <PageTitle title={'Home'} />
        <div className="paper">
          <TabGroup tabs={tabs} defaultTab="summary" />
        </div>
      </>
    );
  }
}

export default Home;