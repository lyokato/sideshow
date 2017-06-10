import * as React from 'react'
import { findDOMNode } from 'react-dom'
import { connect } from 'react-redux'
import { ActionRequestor, bindActionRequestor } from '../action'

export interface Props {
  request: ActionRequestor;
}

class LoginForm extends React.Component<Props, {}> {

  refs: {
    [key: string]: (Element);
    username: Element;
    form: Element;
  }

  _executeLogin() {
    const node = findDOMNode(this.refs.username) as HTMLInputElement;
    const username = node.value.trim()
    if (username.length > 0) {
      this.props.request("session/login", {
        nickname: username,
      })
      node.value = ""
    }
  }

  handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    this._executeLogin()
    e.preventDefault()
  }

  handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const node = findDOMNode(this.refs.form) as HTMLFormElement;
    node.submit();
    e.preventDefault()
  }

  render() {
    return (
      <div className="login-panel">
        <form ref="form" action="#" method="post" onSubmit={e => this.handleSubmit(e)}>
          <label>NICKNAME</label>
          <input type="text" ref="username" className="login-input" pattern="^[a-zA-Z][a-zA-Z0-9_]*$" />
          <button type="submit" className="login-button">LOGIN</button>
        </form>
      </div>
    )
  }
}

export default connect(((state:any, ownProps:any):any => ownProps),
                       bindActionRequestor)(LoginForm)
