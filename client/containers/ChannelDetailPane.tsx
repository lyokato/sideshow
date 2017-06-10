import * as React from 'react'

import ConversationPane from './ConversationPane'
import MembersPane      from './MembersPane'

export interface Props {
}

class ChannelDetailPane extends React.Component<Props, {}> {

  render() {
    return (
      <div className="channel-detail-pane">
        <div className="channel-conversation-and-members-container">

          <ConversationPane />
          <MembersPane />

        </div>
      </div>
    )
  }
}

export default ChannelDetailPane
