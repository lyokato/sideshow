import * as React from 'react'
import { connect } from 'react-redux';

import ChannelListPane   from './ChannelListPane'
import ChannelDetailPane from './ChannelDetailPane'
import LivePane          from './LivePane'

export interface Props {
  liveOpened: boolean;
}

export class Content extends React.Component<Props, {}> {

  render() {
    return (
      <div className="content-panel">

        {(() => {
          if (this.props.liveOpened) {
            return <LivePane />
          }
        })()}

        <div className="pane-container">

          <ChannelListPane />
          <ChannelDetailPane />

        </div>

      </div>
    )
  }
}

function mapStateToProps(state:any, ownProps: any): any {
  return {
    liveOpened: state.live.opened,
  }
}

export default connect(mapStateToProps)(Content)
