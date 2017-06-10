import * as React from 'react'
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom'
import { ActionRequestor, bindActionRequestor } from '../action'

import SystemChannelItem from './ChannelListItem/SystemChannelItem'
import RoomChannelItem   from './ChannelListItem/RoomChannelItem'
import DirectChannelItem from './ChannelListItem/DirectChannelItem'

export interface Props {
  rooms:   any[];
  directs: any[];
  request: ActionRequestor;
}

class ChannelListPane extends React.Component<Props, {}> {

  refs: {
      [key: string]: (Element);
      joinRoomName: Element;
  }

  handleSubmit(e: React.FormEvent<HTMLFormElement>) {

    const node = findDOMNode(this.refs.joinRoomName) as HTMLInputElement
    const roomName = node.value.trim()

    // TODO more precise validation
    if (roomName.length > 0) {
      if (this.props.rooms.includes(roomName)) {
        // already exists
        // showChannel?
      } else {
        this.props.request("room/join", {
          room:     roomName,
          greeting: "",
        })
      }

      node.value = ""
    }

    e.preventDefault()
  }

  render() {
    return (
      <div className="channel-list-pane">
        <div className="channel-list-header">
          <div className="channel-list-title">CHANNELS</div>
        </div>
        <ul className="channel-list">
          <SystemChannelItem />
          {this.props.rooms.map((roomName) =>
             <RoomChannelItem key={roomName} name={roomName}/>
          )}
          {this.props.directs.map((userName) =>
             <DirectChannelItem key={userName} name={userName}/>
          )}
        </ul>
        <form action="#" className="channel-join-box" method="post" onSubmit={e => this.handleSubmit(e)}>
          <div className="channel-join-box-header">+</div>
          <input type="text" className="channel-join-room-name" ref="joinRoomName" placeholder="INPUT ROOM NAME" pattern="^[a-zA-Z][a-zA-Z0-9_]*$" />
        </form>
      </div>
    )
  }
}

function mapStateToProps(state: any, ownProps:any): any {
  return {
    rooms:   state.channels.get("room").keySeq().toArray(),
    directs: state.channels.get("direct").keySeq().toArray(),
  }
}

export default connect(mapStateToProps, bindActionRequestor)(ChannelListPane)
