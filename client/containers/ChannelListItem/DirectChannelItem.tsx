import * as React from 'react'
import { connect } from 'react-redux';
import { bindActionRequestor, ActionRequestor } from '../../action'

export interface Props {
  name:      string;
  selected:  boolean;
  hasUnread: boolean;
  request:   ActionRequestor;
}

class DirectChannelItem extends React.Component<Props, {}> {

  handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    this.props.request("channel/choose", {
      channelType: "direct",
      channelName: this.props.name,
    })
    e.preventDefault()
  }

  render() {
    if (this.props.selected) {
      return <li><a href="#" className="channel-list-item channel-list-item-user channel-list-selected">{this.props.name}</a></li>
    } else if (this.props.hasUnread) {
      return <li><a href="#" className="channel-list-item channel-list-item-user channel-list-unread" onClick={e => this.handleClick(e)}>{this.props.name}</a></li>
    } else {
      return <li><a href="#" className="channel-list-item channel-list-item-user" onClick={e => this.handleClick(e)}>{this.props.name}</a></li>
    }
  }
}

function mapStateToProps(state: any, ownProps: any): any {
  const ch = state.ui.selectedChannel
  return {
    name:      ownProps.name,
    selected:  (ch.type === "direct" && ch.name === ownProps.name),
    hasUnread: state.channels.getIn(["direct", ownProps.name]).hasUnread,
  }
}

export default connect(mapStateToProps, bindActionRequestor)(DirectChannelItem)
