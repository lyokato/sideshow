import * as React from 'react'
import { connect } from 'react-redux';
import { bindActionRequestor, ActionRequestor } from '../../action'

export interface Props {
  name:      string;
  selected:  boolean;
  hasUnread: boolean;
  request:   ActionRequestor;
}

class RoomChannelItem extends React.Component<Props, {}> {

  handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    this.props.request("channel/choose", {
      channelType: "room",
      channelName: this.props.name,
    })
    e.preventDefault()
  }

  render() {
    if (this.props.selected) {
      return <li><a href="#" className="channel-list-item channel-list-item-room channel-list-selected">{this.props.name}</a></li>
    } else if (this.props.hasUnread) {
      return <li><a href="#" className="channel-list-item channel-list-item-room channel-list-unread" onClick={e => this.handleClick(e)}>{this.props.name}</a></li>
    } else {
      return <li><a href="#" className="channel-list-item channel-list-item-room" onClick={e => this.handleClick(e)}>{this.props.name}</a></li>
    }
  }
}

function mapStateToProps(state: any, ownProps: any): any {
  const ch = state.ui.selectedChannel
  return {
    name:      ownProps.name,
    selected:  (ch.type === "room" && ch.name === ownProps.name),
    hasUnread: state.channels.getIn(["room", ownProps.name]).hasUnread,
  }
}

export default connect(mapStateToProps, bindActionRequestor)(RoomChannelItem)
