import moviePlugin from '../../lib/movie'
import CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/mode/css/css'
import 'codemirror/mode/xml/xml'


document.addEventListener('DOMContentLoaded', () => {
  const movie = moviePlugin(CodeMirror, 'code')

  // Create simple UI to interact with movie
  const btn = document.getElementsByTagName('button')[0]
  btn.onclick = function() {
    if (movie.state == 'play') {
      movie.pause()
      this.innerHTML = 'Play'
    } else {
      movie.play()
      this.innerHTML = 'Pause'
    }
  }

  // Listen to events to change UI state
  movie.on('stop', function(name) {
    btn.innerHTML = 'Play'
  })
})
