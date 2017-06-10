import * as React from 'react'
import { connect } from 'react-redux';
import { bindActionRequestor, ActionRequestor } from '../../action'

export interface Props {
  selected: boolean;
  request:  ActionRequestor;
}

class SystemChannelItem extends React.Component<Props, {}> {

  handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    this.props.request("channel/choose", {
      channelType: "system",
      channelName: "system",
    })
    e.preventDefault()
  }

  render() {
    if (this.props.selected) {
      return <li><a href="#" className="channel-list-item channel-list-item-system channel-list-selected">system</a></li>
    } else {
      return <li><a href="#" className="channel-list-item channel-list-item-system" onClick={e => this.handleClick(e)}>system</a></li>
    }
  }
}

function mapStateToProps(state: any, ownProps: any): any {
  const selectedChannel = state.ui.selectedChannel
  return {
    selected: (selectedChannel.type === "system" && selectedChannel.name === "system")
  }
}

export default connect(mapStateToProps, bindActionRequestor)(SystemChannelItem)
