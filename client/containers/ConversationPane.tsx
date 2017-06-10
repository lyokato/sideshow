import * as React from 'react'
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom'
import { bindActionRequestor, ActionRequestor } from '../action'
import { MessageText, TextOrElement } from '../util';

export interface Props {
  channelType: string;
  channelName: string;
  speeches:    any[];
  request:     ActionRequestor;
  liveOpened:  boolean;
}

class ConversationPane extends React.Component<Props, {}> {

  refs: {
      [key: string]: (Element);
      speeches: Element;
      speechInput: Element;
  }

  private shouldScrollBottom: boolean = false;

  // borrowed from
  // http://blog.vjeux.com/2013/javascript/scroll-position-with-react.html
  componentWillUpdate() {
    var list = findDOMNode(this.refs.speeches) as HTMLElement;
    this.shouldScrollBottom = list.scrollTop + list.offsetHeight === list.scrollHeight
  }

  componentDidUpdate() {
    if (this.shouldScrollBottom) {
      var list = findDOMNode(this.refs.speeches) as HTMLElement;
      list.scrollTop = list.scrollHeight
    }
  }

  handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const node = findDOMNode(this.refs.speechInput) as HTMLInputElement;
    const text = node.value.trim()
    if (text.length > 0) {
      //
      if (this.props.channelType === "system") {
        // do nothing
      } else if (this.props.channelType === "direct") {
        this.props.request("direct/chat", {
          user: this.props.channelName,
          text: text,
        })
      } else if (this.props.channelType === "room") {
        this.props.request("room/chat", {
          room: this.props.channelName,
          text: text,
        })
      }
      node.value = ""
    }
    e.preventDefault()
  }

  handleLiveButtonClicked(e: React.MouseEvent<HTMLAnchorElement>) {
    this.props.request("live/open", {
      channelType: this.props.channelType,
      channelName: this.props.channelName,
    })
    e.preventDefault()
  }

  handleLeaveButtonClicked(e: React.MouseEvent<HTMLAnchorElement>) {

    if (this.props.channelType === "direct") {

      this.props.request("direct/leave", {
        user: this.props.channelName,
      })

    } else if (this.props.channelType === "room") {

      this.props.request("room/leave", {
        room: this.props.channelName,
        will: "",
      })

    }
    e.preventDefault()
  }

  dateDigit(s: string): string {
    if (s.length == 1) {
      return "0" + s
    } else {
      return s
    }
  }

  dateStr(t: number): string {
    const d = new Date()
    d.setTime(t)
    return this.dateDigit(d.getHours().toString()) + ":" +
      this.dateDigit(d.getMinutes().toString())
  }


  parseText(text: string, i: number): TextOrElement[] {
    const result = MessageText.parse(text, i);
    return result.nodes;
    /*
    const regex = /(\n)/g
    return text.split(regex).map((line: string, j:number):any => {
      if (line.match(regex)) {
        return React.createElement('br', {key: i.toString() + j.toString()})
      } else {
        return line
      }
    })
    */
  }

  render() {
    return (
      <div className="channel-conversation-pane">

        <div className="channel-conversation-header">
          <div className="channel-conversation-title">CONVERSATION</div>
        </div>

        <div className="channel-command-line">
          {(() => {
            switch (this.props.channelType) {
                case "system":
                  return <div className="channel-name channel-name-system">{this.props.channelName}</div>
                case "room":
                  return <div className="channel-name channel-name-room">{this.props.channelName}</div>
                case "direct":
                  return <div className="channel-name channel-name-direct">{this.props.channelName}</div>
            }
          })()}
          <div className="channel-command-buttons">
            {(() => {
              if (this.props.channelType !== "system" && !this.props.liveOpened) {
                return <a href="#" className="channel-command-button channel-command-button-live" onClick={e => this.handleLiveButtonClicked(e)}>LIVE</a>
              }
            })()}
            {(() => {
              if (this.props.channelType !== "system") {
                return <a href="#" className="channel-command-button channel-command-button-leave" onClick={e => this.handleLeaveButtonClicked(e)}>LEAVE</a>
              }
            })()}
          </div>
        </div>

        <ul className="channel-history" ref="speeches">
          {this.props.speeches.map((speech,i) => {
            if (speech.type !== "ref") {
              return (<li className="speech" key={speech.key}>
                <div className="speech-info">
                  <span className="speaker">{speech.speaker}</span>
                  <span className="speech-date">{this.dateStr(speech.date)}</span>
                </div>
                <div className="speech-text">{this.parseText(speech.text, i)}</div>
              </li>)
            } else {
              return (<li className="reference" key={speech.key}>
                <div className="reference-info">
                  <span className="reference-title">{speech.title}</span>
                  <span className="reference-url">{speech.url}</span>
                </div>
                <img className="reference-img" src={speech.image} />
                <div className="reference-description">{speech.description}</div>
              </li>)
            }
          })}
        </ul>

        <form action="#" className="channel-speech-box" onSubmit={e => this.handleSubmit(e)}>
          <div className="channel-speech-box-header">&gt;&gt;</div>
          <input type="text" ref="speechInput" className="channel-speech-box-input" placeholder="INPUT COMMENT" />
        </form>

      </div>
    )
  }
}

function mapStateToProps(state: any, ownProps: any): any {
  const channel = state.ui.selectedChannel;
  const speeches = state.channels.getIn([channel.type, channel.name]).speeches
  return {
    channelType: channel.type,
    channelName: channel.name,
    speeches:    speeches,
    liveOpened:  state.live.opened,
  }
}

export default connect(mapStateToProps, bindActionRequestor)(ConversationPane)
