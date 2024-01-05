import React, { useState } from 'react';
import axios from 'axios';


function Quotes() {
  const [res, setRes] = useState('');

  function startConnection() {
    console.log('Requesting quote...');
    axios.get('http://localhost:3001/start')
      .then(response => {
        console.log('Response:', response);
        setRes(response.data);
      })
      .catch(error => {
        console.error('Error fetching quote:', error);
      });
  }

  function showAccounts() {
    console.log('Requesting quote...');
    axios.get('http://localhost:3001/show_accounts')
      .then(response => {
        console.log('Response:', response);
        setRes(response.data);
      })
      .catch(error => {
        console.error('Error fetching quote:', error);
      });
  }

  return (
    <div>
      <button onClick={startConnection}>Connect to chain</button>
      <button onClick={showAccounts}>Show accounts</button>
      <p>Res: {res}</p>
    </div>
  );
}

export default Quotes;
