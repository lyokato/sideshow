import * as React from 'react'
import { connect } from 'react-redux';
import { bindActionRequestor, ActionRequestor } from '../../action'

export interface Props {
  channelType: string;
  channelName: string;
  statusText:  string;
  request: ActionRequestor;
}

class LiveStatusLine extends React.Component<Props, {}> {

  handleQuitButtonClick(e: React.MouseEvent<HTMLAnchorElement>) {
    this.props.request("rtc/quit", {})
    e.preventDefault()
  }

  render() {
    return (
      <div className="live-status-line">
        <div className="live-status-line-header">
          <span className="live-status-text-top">LIVE</span>
        {(() => {
          if (this.props.channelType === "room") {
            return <span className="channel-name channel-name-room">{this.props.channelName}</span>
          } else {
            return <span className="channel-name channel-name-direct">{this.props.channelName}</span>
          }
        })()}
        </div>
        <div className="live-status-text">{this.props.statusText}</div>
        <div className="live-status-command-buttons">
          <a href="#" className="channel-command-button channel-command-button-leave" onClick={e => this.handleQuitButtonClick(e)}>QUIT</a>
        </div>
      </div>
    )
  }

}

function mapStateToProps(state: any, ownProps: any): any {
  const channel = state.live.selectedChannel;
  const statusText = state.live.phase == "init" ? "CHOOSE MODE" : "ON AIR";
  return {
    channelType: channel.type,
    channelName: channel.name,
    statusText: statusText,
  }
}

export default connect(mapStateToProps, bindActionRequestor)(LiveStatusLine)
