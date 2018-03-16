import React from 'react'
import {UnControlled} from 'react-codemirror2'

import moviePlugin from '../../lib/movie'
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/mode/css/css'
import 'codemirror/mode/xml/xml'


const value = `
<!doctype html>
<html lang="en">
<head>
	<title></title>
</head>
<body>
	<header>
		|
	</header>
</body>
</html>
@@@
# Lines started with # sign are comments and ignored by movie parser
prompt: Hello world
# Use ::: separator to create outline item for current action
type: Hello world ::: Typing “Hello world”
wait: 1000
# Passing command options as JS object
tooltip: {text: "Sample tooltip", wait: 2000}
tooltip: {text: "Sample tooltip 3", wait: 2000}
tooltip: {text: "Sample tooltip 5", wait: 2000}
# wait: 600
# Perform CodeMirror pre-defined command
# run: {command: "goWordLeft", times: 2} ::: Move word left
`


class App extends React.Component {

  constructor() {
    super()

    this.movie = null

    this.state = {
      playing: false
    }

    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount() {

    this.movie = moviePlugin(CodeMirror, this.instance)

    // Listen to events to change UI state
    this.movie.on('stop', name => {
      this.setState({
        playing: false
      })
    })
  }

  handleClick() {

    if (this.movie.state == 'play') {
      this.movie.pause()

      this.setState({
        playing: false
      })
    } else {

      this.movie.play()
      this.setState({
        playing: true
      })
    }
  }

  render() {
    return (
      <div>
        <h1>CodeMirror Movie</h1>

        <UnControlled
          editorDidMount={editor => {this.instance = editor}}
          value={value}
          onChange={(editor, data, value) => {
          }}
          options={{
            mode: 'xml',
            theme: 'material',
            lineNumbers: true
          }}
        />

        {!this.state.playing &&
          <button
            style={{
              fontSize: '2em',
              margin: '10px auto',
              display: 'block'
            }}
            onClick={this.handleClick}
          >Start</button>
        }
      </div>
    )
  }
}


export default App
