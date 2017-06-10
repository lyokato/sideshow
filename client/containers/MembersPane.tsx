import * as React from 'react'
import { connect } from 'react-redux';

import MembersListItem from './MembersListItem'

export interface Props {
  keyHeader: string;
  members:   string[];
}

class MembersPane extends React.Component<Props, {}> {

  render() {
    return (
      <div className="channel-members-pane">

        <div className="channel-members-header">
          <div className="channel-members-title">MEMBERS</div>
        </div>

        <ul className="channel-members-list">
          {this.props.members.map(userName =>
            <MembersListItem key={this.props.keyHeader + userName} name={userName}/>
          )}
        </ul>

      </div>
    )
  }
}

function mapStateToProps(state: any, ownProps: any): any {
  const ch = state.ui.selectedChannel;
  switch (ch.type) {
    case "system":
      return {
        keyHeader: "system:system:",
        members: [state.session.nickname],
      }
    case "direct":
      return {
        keyHeader: "direct:" + ch.name + ":",
        members: [state.session.nickname, ch.name],
      }
    case "room":
      return {
        keyHeader: "room:" + ch.name + ":",
        members: state.members.get(ch.name).toArray(),
      }
  }
}

export default connect(mapStateToProps)(MembersPane)
