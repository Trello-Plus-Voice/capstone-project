import React from "react"
// import Buffer from "buffer"
import PropTypes from "prop-types" // ES6
import { getTranscription } from "../store/singleUser"
import { createProject, deleteProject } from "../store/singleUser"
import { updateProject } from "../store/singleProject"
import { connect } from "react-redux"

export const RecordState = Object.freeze({
  START: "start",
  PAUSE: "pause",
  STOP: "stop",
  NONE: "none",
})

class AudioSetup extends React.Component {
  //0 - constructor
  constructor(props) {
    super(props)
    console.log(props)

    this.canvasRef = React.createRef()
    this.state = {
      transcript: "",
      loader: false,
    }
    this.recognizeCommand = this.recognizeCommand.bind(this)
  }

  //TODO: add the props definitions
  static propTypes = {
    state: PropTypes.string,
    type: PropTypes.string.isRequired,
    backgroundColor: PropTypes.string,
    foregroundColor: PropTypes.string,
    canvasWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    canvasHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    //method calls
    onStop: PropTypes.func,
  }
  static defaultProps = {
    state: RecordState.NONE,
    type: "audio/wav",
    backgroundColor: "rgb(200, 200, 200)",
    foregroundColor: "rgb(0, 0, 0)",
    canvasWidth: 100,
    canvasHeight: 60,
  }

  //2 - mount
  componentDidMount() {
    this.init()
  }

  componentDidUpdate(prevProps, prevState) {
    const { state } = this.props

    this.checkState(prevProps.state, state)
  }

  addToast() {
    toastIdRef.current = toast({
      description: "Project successfully added!",
      status: "success",
    })
  }

  recognizeCommand = (transcription, user) => {
    let lowerTranscription = transcription.toLowerCase()
    const { id } = user
    //Create Project (in singleProject, invoke addProject() method)
    if (lowerTranscription === "create new project") {
      this.props.addProject(id)
      addToast()
      //Delete Project (in singleProject, invoke deleteProject() method)
    } else if (lowerTranscription.split(" ")[0] === "delete") {
      // return delete command and the project to be deleted
      user.projects.map((project) => {
        if (
          project.boardName.toLowerCase() === lowerTranscription.split(" ")[1]
        ) {
          this.props.deleteProj(id, project.id)
        }
      })
      //View project
    } else if (lowerTranscription.split(" ")[0] === "view") {
      user.projects.map((project) => {
        if (
          project.boardName.toLowerCase() === lowerTranscription.split(" ")[1]
        ) {
          location.replace(`http://localhost:8080/projects/${project.id}`)
        }
      })
    } else if (lowerTranscription.split(" ")[0] === "rename") {
      console.log("we are in")
      user.projects.map((project) => {
        if (
          project.boardName.toLowerCase() === lowerTranscription.split(" ")[1]
        ) {
          const updatedName = lowerTranscription.split(" ")[2]
          updatedName[0].toUpperCase()
          this.props.updateProj(project.id, updatedName)
        }
      })
    }
  }

  checkState(previousState) {
    switch (previousState) {
      case RecordState.START:
        this.doIfState(RecordState.PAUSE, this.pause)
        this.doIfState(RecordState.STOP, this.stop)
        break
      case RecordState.PAUSE:
        this.doIfState(RecordState.START, this.resume)
        this.doIfState(RecordState.STOP, this.stop)
        break
      case RecordState.STOP:
        this.doIfState(RecordState.START, this.start)
        break
      default:
        this.doIfState(RecordState.START, this.start)
        break
    }
  }

  doIfState(state, cb) {
    if (this.props.state == state) {
      cb && cb()
    }
  }

  //TODO: destroy request animation frame
  componentWillUnmount() {}

  //TODO: change to state some conditionals
  init = async () => {
    this.leftchannel = []
    this.rightchannel = []
    this.recorder = null
    this.recording = false
    this.recordingLength = 0
    this.volume = null
    this.audioInput = null
    this.sampleRate = null
    this.AudioContext = window.AudioContext || window.webkitAudioContext
    this.context = null
    this.analyser = null
    this.canvas = this.canvasRef.current
    this.canvasCtx = this.canvas.getContext("2d")
    this.stream = null
    this.tested = false

    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia
  }

  //get mic stream
  getStream = (constraints) => {
    if (!constraints) {
      constraints = { audio: true, video: false }
    }

    return navigator.mediaDevices.getUserMedia(constraints)
  }

  setUpRecording = () => {
    this.context = new this.AudioContext()
    this.sampleRate = this.context.sampleRate

    // creates a gain node
    this.volume = this.context.createGain()

    // creates an audio node from teh microphone incoming stream
    this.audioInput = this.context.createMediaStreamSource(this.stream)

    // Create analyser
    this.analyser = this.context.createAnalyser()

    // connect audio input to the analyser
    this.audioInput.connect(this.analyser)

    // connect analyser to the volume control
    // analyser.connect(volume);

    let bufferSize = 2048
    this.recorder = this.context.createScriptProcessor(bufferSize, 2, 2)

    // we connect the volume control to the processor
    // volume.connect(recorder);

    this.analyser.connect(this.recorder)

    // finally connect the processor to the output
    this.recorder.connect(this.context.destination)

    const self = this
    this.recorder.onaudioprocess = function (e) {
      // Check
      if (!self.recording) return
      // Do something with the data, i.e Convert this to WAV
      let left = e.inputBuffer.getChannelData(0)
      let right = e.inputBuffer.getChannelData(1)
      if (!self.tested) {
        self.tested = true
        // if this reduces to 0 we are not getting any sound
        if (!left.reduce((a, b) => a + b)) {
          console.log("Error: There seems to be an issue with your Mic")
          // clean up;
          self.stop()
          self.stream.getTracks().forEach(function (track) {
            track.stop()
          })
          self.context.close()
        }
      }
      // we clone the samples
      self.leftchannel.push(new Float32Array(left))
      self.rightchannel.push(new Float32Array(right))
      self.recordingLength += bufferSize
    }
    this.visualize()
  }

  mergeBuffers = (channelBuffer, recordingLength) => {
    let result = new Float32Array(recordingLength)
    let offset = 0
    let lng = channelBuffer.length
    for (let i = 0; i < lng; i++) {
      let buffer = channelBuffer[i]
      result.set(buffer, offset)
      offset += buffer.length
    }
    return result
  }

  interleave = (leftChannel, rightChannel) => {
    let length = leftChannel.length + rightChannel.length
    let result = new Float32Array(length)

    let inputIndex = 0

    for (let index = 0; index < length; ) {
      result[index++] = leftChannel[inputIndex]
      result[index++] = rightChannel[inputIndex]
      inputIndex++
    }
    return result
  }

  writeUTFBytes = (view, offset, string) => {
    let lng = string.length
    for (let i = 0; i < lng; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  visualize = () => {
    const { backgroundColor, foregroundColor } = this.props

    this.WIDTH = this.canvas.width
    this.HEIGHT = this.canvas.height
    this.CENTERX = this.canvas.width / 2
    this.CENTERY = this.canvas.height / 2

    if (!this.analyser) return

    this.analyser.fftSize = 2048
    const bufferLength = this.analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)

    this.canvasCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT)

    //reference this using self
    let self = this
    const draw = function () {
      self.drawVisual = requestAnimationFrame(draw)

      self.analyser.getByteTimeDomainData(dataArray)

      self.canvasCtx.fillStyle = backgroundColor
      self.canvasCtx.fillRect(0, 0, self.WIDTH, self.HEIGHT)

      self.canvasCtx.lineWidth = 2
      self.canvasCtx.strokeStyle = foregroundColor

      self.canvasCtx.beginPath()

      var sliceWidth = (self.WIDTH * 1.0) / bufferLength
      var x = 0

      for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0
        var y = (v * self.HEIGHT) / 2

        if (i === 0) {
          self.canvasCtx.moveTo(x, y)
        } else {
          self.canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      self.canvasCtx.lineTo(self.canvas.width, self.canvas.height / 2)
      self.canvasCtx.stroke()
    }

    draw()
  }

  setupMic = async () => {
    //TODO: only get stream after clicking start
    try {
      window.stream = this.stream = await this.getStream()
      //TODO: on got stream
    } catch (err) {
      //TODO: error getting stream
      console.log("Error: Issue getting mic", err)
    }

    this.setUpRecording()
  }

  setTranscript = (blob) => {
    // convert blob into string that we can send to backend
    function blobToBase64(blob) {
      return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    }

    // make the request to transcribe
    function getWords(blobStr) {
      return new Promise((resolve, _) => {
        resolve(getTranscription(blobStr))
      })
    }

    blobToBase64(blob).then(
      (x) => {
        this.setState({
          transcript: "",
          loader: true,
        })
        getWords(x).then(
          (y) => {
            this.setState({
              transcript: y,
              loader: false,
            })
            this.recognizeCommand(y, this.props.user)
          },
          () => console.log("Error getting transcript")
        )
      },
      () => console.log("Error converting blob to string")
    )
  }

  start = async () => {
    await this.setupMic()

    this.recording = true
    // reset the buffers for the new recording
    this.leftchannel.length = this.rightchannel.length = 0
    this.recordingLength = 0
  }

  // .wav file created and sent, transcript received and set
  stop = () => {
    const { onStop, type } = this.props

    this.recording = false
    this.closeMic()

    // flat the left and right channels down
    this.leftBuffer = this.mergeBuffers(this.leftchannel, this.recordingLength)
    this.rightBuffer = this.mergeBuffers(
      this.rightchannel,
      this.recordingLength
    )
    // interleave both channels together
    let interleaved = this.interleave(this.leftBuffer, this.rightBuffer)

    ///////////// WAV Encode /////////////////
    // from http://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio/

    // create wav file
    let buffer = new ArrayBuffer(44 + interleaved.length * 2)
    let view = new DataView(buffer)

    // RIFF chunk descriptor
    this.writeUTFBytes(view, 0, "RIFF")
    view.setUint32(4, 44 + interleaved.length * 2, true)
    this.writeUTFBytes(view, 8, "WAVE")
    // FMT sub-chunk
    this.writeUTFBytes(view, 12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    // stereo (2 channels)
    view.setUint16(22, 2, true)
    view.setUint32(24, this.sampleRate, true)
    view.setUint32(28, this.sampleRate * 4, true)
    view.setUint16(32, 4, true)
    view.setUint16(34, 16, true)
    // data sub-chunk
    this.writeUTFBytes(view, 36, "data")
    view.setUint32(40, interleaved.length * 2, true)

    // write the PCM samples
    let lng = interleaved.length
    let index = 44
    let volume = 1
    for (let i = 0; i < lng; i++) {
      view.setInt16(index, interleaved[i] * (0x7fff * volume), true)
      index += 2
    }

    const blob = new Blob([view], { type: type })

    // set the transcript
    this.setTranscript(blob)

    // create url for user
    const audioUrl = URL.createObjectURL(blob)

    // everything here gets logged to the conosle
    onStop &&
      onStop({
        blob: blob,
        url: audioUrl,
        type,
      })
  }

  pause = () => {
    this.recording = false
    this.closeMic()
  }

  resume = () => {
    this.setupMic()
    this.recording = true
  }

  closeMic = () => {
    this.stream.getAudioTracks().forEach((track) => {
      track.stop()
    })
    this.audioInput.disconnect(0)
    this.analyser.disconnect(0)
    this.recorder.disconnect(0)
  }

  //1 - render
  render() {
    const { canvasWidth, canvasHeight } = this.props

    return (
      <div className="audio-react-recorder flexed">
        <canvas
          ref={this.canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`audio-react-recorder__canvas ${
            this.props.firstClick ? "" : "hidden"
          }`}
        ></canvas>

        <div className={`${this.state.loader ? "leftMargin" : "hidden"}`}>
          <div className="lds-ripple">
            <div></div>
            <div></div>
          </div>
        </div>
        <p className="leftMargin">{this.state.transcript}</p>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addProject: (id) => dispatch(createProject(id)),
    deleteProj: (id, projId) => dispatch(deleteProject(id, projId)),
    updateProj: (projId, updatedName) =>
      dispatch(updateProject(projId, updatedName)),
  }
}

export default connect(null, mapDispatchToProps)(AudioSetup)
