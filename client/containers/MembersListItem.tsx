import * as React from 'react'
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom'
import { bindActionRequestor, ActionRequestor } from '../action'

export interface Props {
  name:    string;
  isMe:    boolean;
  request: ActionRequestor;
}

class MembersListItem extends React.Component<Props, {}> {

  handleDoubleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    this.props.request("channel/choose", {
      channelType: "direct",
      channelName: this.props.name,
    })
  }

  componentDidMount() {
    if (!this.props.isMe) {
      (findDOMNode(this.refs.memberItem) as HTMLInputElement).ondblclick = this.handleDoubleClick.bind(this)
    }
  }

  render() {
    return (
      <li><a href="#" className="channel-members-list-item" ref="memberItem">{this.props.name}</a></li>
    )
  }
}

function mapStateToProps(state: any, ownProps: any): any {
  return {
    name: ownProps.name,
    isMe: (state.session.nickname === ownProps.name),
  }
}

export default connect(mapStateToProps, bindActionRequestor)(MembersListItem)
