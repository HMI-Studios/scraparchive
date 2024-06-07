import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import InputForm from '../components/InputForm.jsx';

class Signup extends React.Component {
  constructor(props) {
    super(props);

    this.signup = this.signup.bind(this);
  }

  signup({ username, email, password }) {
    axios.post(`${window.ADDR_PREFIX}/signup`, { username, email, password })
    .then(() => {
      this.props.verifySession();
    })
    .then(() => {
      this.setState({ redirect: '' });
    })
  }

  render() {
    const { name, setView } = this.props;
    return (
      <div className="auth">
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