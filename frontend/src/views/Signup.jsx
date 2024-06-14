import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from '../configuredAxios.js';

import InputForm from '../components/InputForm.jsx';

class Signup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null,
    };

    this.signup = this.signup.bind(this);
  }

  signup({ username, email, password }) {
    axios.post('/signup', { username, email, password })
    .then(() => {
      this.props.verifySession();
    })
    .then(() => {
      this.setState({ redirect: '' });
    })
  }

  render() {
    const { name, setView } = this.props;
    const { redirect } = this.state;

    return (
      <div className="auth">
        {redirect !== null && <Navigate to={`${window.ADDR_PREFIX}${redirect}`} />}
        <div className="stack">
          <InputForm submitFn={this.signup} submitText={'Sign Up'} fields={{
            username: 'Username',
            email: 'E-Mail',
            password: 'Password',
          }} required={{
            username: true,
            email: true,
            password: true,
          }} types={{
            email: 'email',
            password: 'password',
          }} />
          <Link
            className="btn textBtn"
            to={`${window.ADDR_PREFIX}/login`}
          >
            Login to existing user account
          </Link>
        </div>
      </div>
    );
  }
}

export default Signup;