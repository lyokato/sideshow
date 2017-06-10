import * as React from 'react'
import { connect } from 'react-redux';
import { bindActionRequestor, ActionRequestor } from '../../action'

export interface Props {
  channelType: string;
  channelName: string;
  role:        string;
  request:     ActionRequestor;
}

class LiveConnectionPanel extends React.Component<Props, {}> {

  componentDidMount() {

    this.props.request("rtc/start", {
      role:        this.props.role,
      channelType: this.props.channelType,
      channelName: this.props.channelName,
    })

  }

  render() {
    return (
      <ul className="live-stream-list" id="live-stream-container">
      </ul>
    )
  }

}

function mapStateToProps(state: any, ownProps: any): any {
  const channel = state.live.selectedChannel;
  return {
    channelType: channel.type,
    channelName: channel.name,
    role:        state.live.role,
  }
}

export default connect(mapStateToProps, bindActionRequestor)(LiveConnectionPanel)
