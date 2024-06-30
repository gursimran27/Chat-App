import React from 'react'
import "./Spinner.css";

const Spinner = () => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width:"100vw",
    height:'100vh'
  };

  const childStyle = {
    marginTop: '0.5rem', // space-y-2 in Tailwind corresponds to 0.5rem margin top
  };

  const textStyle = {
    fontSize: '1.875rem', // 3xl in Tailwind is 1.875rem or 30px
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #1FA2FF, #12D8FA, #A6FFCB)',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  };

  return (
    <div style={containerStyle}>
      <div className="custom-loader" style={childStyle}></div>
      <p style={{ ...childStyle, ...textStyle }}>Loading...</p>
    </div>
  );
};


export default Spinner