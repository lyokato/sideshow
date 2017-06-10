import * as React from 'react'
import { connect } from 'react-redux';
import LiveStreams from './LiveStreams'

export interface Props {
  liveOpened: boolean;
}

class LivePane extends React.Component<Props, {}> {

  render() {
    if (this.props.liveOpened) {
      return (
        <div className="live-pane live-pane-active" key="live-pane">
          <LiveStreams />
        </div>)
    } else {
      return (
        <div className="live-pane" key="live-pane">
          <LiveStreams />
        </div>)
    }
  }

}

function mapStateToProps(state:any, ownProps: any): any {
  return {
    liveOpened: state.live.opened,
  }
}

export default connect(mapStateToProps)(LivePane)
