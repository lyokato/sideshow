import * as React from 'react'

export const randomString = function(len: number): string {
  let result = ""
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  const cl = c.length;
  for(let i = 0; i < len; i++) {
   result += c[Math.floor(Math.random() * cl)]
  }
  return result
}

export type TextOrElement = string | React.ReactElement<any>;

const nl2brRegex = /(\n)/g;
const urlRegex   = /(https?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+)/g;

export class MessageText {

  static parse(str: string, i: number): MessageText {
    const result = new MessageText(str);
    str.split(urlRegex).forEach((part: string, j: number) => {
      if (part.match(urlRegex)) {
        const elem = React.createElement('a', {
          key: "a:" + i.toString() + ":" + j.toString(),
          className: "speech-text-link",
          href: part,
          target: "_blank",
        }, part);
        result.addURL(part);
        result.addNode(elem);
      } else {
        part.split(nl2brRegex).forEach((part2: string, k: number) => {
          if (part2.match(nl2brRegex)) {
            const elem = React.createElement('br', {key: "br:" + i.toString() + ":" + j.toString() + ":" + k.toString()})
            result.addNode(elem);
          } else {
            result.addNode(part2);
          }
        });
      }
    });
    return result;
  }

  origin: string;
  nodes:  TextOrElement[] = [];
  urls:   string[]        = [];

  constructor(origin: string) {
    this.origin = origin;
  }

  addURL(url: string) {
    this.urls.push(url);
  }

  addNode(node: TextOrElement) {
    this.nodes.push(node);
  }
}


export const nl2br = (text: string, i: number): TextOrElement[] => {
  const regex = /(\n)/g;
  return text.split(regex).map((line: string, j :number) :any => {
    if (line.match(regex)) {
      return React.createElement('br', {key: "br:" + i.toString() + ":" + j.toString()})
    } else {
      return line
    }
  })
};

export const url2link = (text: string, i: number): TextOrElement[] => {
  const regex =  /((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g;
  return text.split(regex).map((part: string, j :number): any => {
    if (part.match(regex)) {
      return React.createElement('a', {
        key: "a:" + i.toString() + ":" + j.toString(),
        className: "linkable-text",
        href: part,
      }, part);
    } else {
      return part;
    }
  });
};

