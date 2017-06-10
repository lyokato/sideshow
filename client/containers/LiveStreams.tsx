import * as React from 'react'
import { connect } from 'react-redux';

import LiveStatusLine      from './Live/StatusLine'
import LiveStartPanel      from './Live/StartPanel'
import LiveConnectionPanel from './Live/ConnectionPanel'

export interface Props {
  phase: string;
}

class LiveStreams extends React.Component<Props, {}> {

  render() {
    return (
      <div className="live-streams">

        <LiveStatusLine />

        {(() => {
          if (this.props.phase === "init") {
            return <LiveStartPanel />
          } else {
            return <LiveConnectionPanel />
          }
        })()}

      </div>

    )
  }

}

function mapStateToProps(state: any, ownProps: any) : any {
  // FIXME later
  return {
    phase: state.live.phase
  }
}

export default connect(mapStateToProps)(LiveStreams)
