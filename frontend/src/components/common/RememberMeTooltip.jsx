import React from 'react';
import '../../styles/RememberMeTooltip.scss';

class RememberMeTooltip extends React.Component {
  state = { show: false };

  showTooltip = () => this.setState({ show: true });
  hideTooltip = () => this.setState({ show: false });

  render() {
    return (
      <span
        className="remember-me-tooltip-wrapper"
        onMouseEnter={this.showTooltip}
        onMouseLeave={this.hideTooltip}
        tabIndex={0}
        onFocus={this.showTooltip}
        onBlur={this.hideTooltip}
      >
        {/* Modern info icon SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          style={{ cursor: 'pointer' }}
        >
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 0 11zm.93-7.412a.5.5 0 0 0-.858-.514l-1 1.5a.5.5 0 0 0 .858.514l1-1.5zm-.93 2.912a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-.5-.5z" />
        </svg>
        <span
          className="remember-me-tooltip"
          style={{ display: this.state.show ? 'block' : 'none' }}
        >
          Se marcado, você permanecerá conectado mesmo após fechar o navegador. Não use em
          computadores públicos.
        </span>
      </span>
    );
  }
}

export default RememberMeTooltip;
