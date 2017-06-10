import * as React from 'react'
import { connect } from 'react-redux';

export interface Props {
}

class Footer extends React.Component<Props, {}> {

  render() {
    return (
      <footer>
        <div className="footer-desc">copyright(c) 2017 &#64;lyokato</div>
      </footer>
    )
  }
}

function mapStateToProps(state: any, ownProps: any): any {
  return ownProps
}

export default connect(mapStateToProps)(Footer)
