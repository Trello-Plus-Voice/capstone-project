import React, { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import {
  fetchSingleUser,
  createProject,
  deleteProject,
} from "../store/singleUser"
import { useRangeSlider, useToast } from "@chakra-ui/react"
import { Button } from "@chakra-ui/button"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

const SingleUser = (props) => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const auth = useSelector((state) => state.auth)
  const proj = useSelector((state) => state.proj)
  const [projects, setProjects] = useState([])
  const [Projects, updateProjects] = useState(user.projects)

  const { isAdmin } = auth

  useEffect(() => {
    const { id } = props.match.params
    dispatch(fetchSingleUser(id))
  }, [projects, Projects])

  const handleAddProject = (e) => {
    e.preventDefault()
    const { id } = props.match.params
    dispatch(createProject(id))
    setProjects([...projects, {}])
  }

  const handleDeleteProject = (e, itemId) => {
    e.preventDefault()
    const { userId } = props.match.params
    dispatch(deleteProject(userId, itemId))
    setProjects([...projects, {}])
  }
  const handleOnDragEnd = (result) => {
    if (!result.destination) return
    let items = Array.from(Projects)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    updateProjects(items)
  }

  const toast = useToast()
  const toastIdRef = React.useRef()
  function addToast() {
    toastIdRef.current = toast({ description: "Project successfully added!" })
  }

  // setTimeout( ()=> {}, 1000)

  return (
    <div className="container">
      {console.log(user)}

      {}

      {isAdmin || user.id === auth.id ? (
        <div>
          {user.username ? (
            <div>
              <p>Home page of {user.username}</p>
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="projects">
                  {(provided) => (
                    <ul
                      className="container"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      <h2>Projects</h2>
                      <Button onClick={addToast} type="button">
                        <div
                          className="createNewProject"
                          onClick={handleAddProject}
                        >
                          +
                        </div>
                      </Button>

                      {Projects && // user.proj
                        //need to sort by number other than id sort((a, b) => a.id - b.id)
                        Projects.map((x, index) => {
                          return (
                            <Draggable
                              key={x.id}
                              draggableId={x.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <Link
                                  className="allProjectsBox"
                                  to={`/projects/${x.id}`}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  ref={provided.innerRef}
                                >
                                  <h3>{x.boardName}</h3>
                                  <button
                                    className="deleteProject"
                                    onClick={(e) =>
                                      handleDeleteProject(e, x.id)
                                    }
                                  >
                                    x
                                  </button>
                                </Link>
                              )}
                            </Draggable>
                          )
                        })}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          ) : (
            <p>No user.</p>
          )}
        </div>
      ) : (
        <p>Unauthorized</p>
      )}
    </div>
  )
}

export default SingleUser
