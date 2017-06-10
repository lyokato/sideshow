import * as React from 'react'
import { connect } from 'react-redux';
import { bindActionRequestor, ActionRequestor } from '../../action'

export interface Props {
  request: ActionRequestor;
  liveOpened: boolean;
}

class LiveStartPanel extends React.Component<Props, {}> {

  handleAudienceStartButtonClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (this.props.liveOpened) {
      this.props.request("live/start", {
        role: "audience"
      })
    }
    e.preventDefault()
  }

  handleAudioStartButtonClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (this.props.liveOpened) {
      this.props.request("live/start", {
        role: "performer/audio"
      })
    }
    e.preventDefault()
  }

  handleVideoStartButtonClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (this.props.liveOpened) {
      this.props.request("live/start", {
        role: "performer/video"
      })
    }
    e.preventDefault()
  }

  render() {
    return (
      <div className="live-start-panel">
        <a href="#" className="live-start-button" onClick={e => this.handleAudienceStartButtonClick(e)}>AUDIENCE</a>
        <a href="#" className="live-start-button" onClick={e => this.handleAudioStartButtonClick(e)}>AUDIO</a>
        <a href="#" className="live-start-button" onClick={e => this.handleVideoStartButtonClick(e)}>VIDEO</a>
      </div>
    )
  }
}

function mapStateToProps(state:any, ownProps: any): any {
  return {
    liveOpened: state.live.opened,
  }
}


export default connect(mapStateToProps,
                       bindActionRequestor)(LiveStartPanel)
