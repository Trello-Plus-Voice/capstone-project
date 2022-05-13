import axios from "axios"

const GET_SINGLE_PROJECT = "GET_SINGLE_PROJECT"
const ADD_SINGLE_LIST = "ADD_SINGLE_LIST"
const DELETE_SINGLE_LIST = "DELETE_SINGLE_LIST"
const UPDATE_SINGLE_LIST = "UPDATE_SINGLE_LIST"
const UPDATE_PROJECT = "UPDATE_PROJECT"

const DELETE_SINGLE_TASK = "DELETE_SINGLE_TASK"
const ADD_SINGLE_TASK = "ADD_SINGLE_TASK"
const UPDATE_SINGLE_TASK = "UPDATE_SINGLE_TASK"

function getProject(project) {
  return {
    type: GET_SINGLE_PROJECT,
    project,
  }
}

function addList(list) {
  return {
    type: ADD_SINGLE_LIST,
    list,
  }
}

function deleteList(list) {
  return {
    type: DELETE_SINGLE_LIST,
    list,
  }
}

function updateProj(project) {
  return {
    type: UPDATE_PROJECT,
    project,
  }
}

function updateTask(task) {
  return {
    type: UPDATE_SINGLE_TASK,
    task,
  }
}

function deleteTask(task) {
  return {
    type: DELETE_SINGLE_TASK,
    task,
  }
}

function addTask(task) {
  return {
    type: ADD_SINGLE_TASK,
    task,
  }
}

function updateList(list) {
  return {
    type: UPDATE_SINGLE_LIST,
    list,
  }
}

export function fetchSingleProject(projectId) {
  return async (dispatch) => {
    try {
      const { data } = await axios.get(`/api/projects/${projectId}`)
      dispatch(getProject(data))
    } catch (error) {
      next(error)
    }
  }
}

export function addSingleList(id) {
  return async (dispatch) => {
    try {
      const { data } = await axios.post(`/api/projects/${id}`)
      dispatch(addList(data))
    } catch (error) {
      next(error)
    }
  }
}

export function deleteSingleList(projectId, listId) {
  return async (dispatch) => {
    try {
      const { data } = await axios.delete(
        `/api/projects/${projectId}/lists/${listId}`
      )
      dispatch(deleteList(data))
    } catch (error) {
      next(error)
    }
  }
}

// export function editSingleTask(userId, projectId) {
//   return async (dispatch) => {
//     try {
//       const payload = { boardName: newName }
//       const { data } = await axios.put(
//         `/api/users/${userId}/projects/${projectId}`
//       )
//       dispatch(editTask(data))
//     } catch (error) {
//       next(error)
//     }
//   }
// }

export function updateProject(projectId, newName) {
  return async (dispatch) => {
    try {
      const payload = { boardName: newName }
      const { data } = await axios.put(`/api/projects/${projectId}`, payload)
      dispatch(updateProj(data))
    } catch (error) {
      next(error)
    }
  }
}

export function addSingleTask(projectId, listId) {
  return async (dispatch) => {
    try {
      const payload = {
        taskName: "--Add Task Name--",
        notes: "--Add Task Notes--",
        imageUrl: "",
      }
      const { data } = await axios.post(
        `/api/projects/${projectId}/lists/${listId}`,
        payload
      )
      dispatch(addTask(data))
    } catch (error) {
      next(error)
    }
  }
}

export function deleteSingleTask(projectId, listId, taskId) {
  return async (dispatch) => {
    try {
      const { data } = await axios.delete(
        `/api/projects/${projectId}/lists/${listId}/tasks/${taskId}`
      )
      dispatch(deleteTask(data))
    } catch (error) {
      next(error)
    }
  }
}

export function updateListThunk(userId, listId, list) {
  return async (dispatch) => {
    try {
      const { data: list } = await axios.put(
        `/api/projects/${userId}/lists/${listId}`,
        list
      )
      dispatch(updateList(list))
    } catch (error) {
      next(error)
    }
  }
}

export function updateTaskThunk(userId, taskId, task) {
  return async (dispatch) => {
    try {
      const { data: task } = await axios.put(
        `/api/projects/${userId}/tasks/${taskId}`,
        task
      )
      dispatch(updateTask(task))
    } catch (error) {
      next(error)
    }
  }
}

const defaultState = {}

export default function singleProjectReducer(state = defaultState, action) {
  switch (action.type) {
    case GET_SINGLE_PROJECT:
      //is auth necessary for projects? YES
      return { ...action.project, ...action.auth }
    case ADD_SINGLE_LIST:
      state.lists.push(action.list)
      return { ...state }
    case DELETE_SINGLE_LIST:
      state.lists = state.lists.filter((x) => {
        return x.id !== action.list.id && x
      })
    case ADD_SINGLE_TASK:
      const list1 = state.lists
        .filter((x) => {
          return x.id === action.task.listId && x
        })
        .pop()
      list1.tasks.push(action.task)
      state.lists.map((x) => {
        if (x.id === list1.id) {
          return list1
        }
        return x
      })
      return { ...state }
    case DELETE_SINGLE_TASK:
      const copiedList = JSON.parse(JSON.stringify(state.lists))
      const list2 = copiedList
        .filter((x) => {
          return x.id === action.task.listId
        })[0]
        .tasks.filter((x) => {
          return x.id !== action.task.id
        })
      const allLists = copiedList.map((x) => {
        if (x.id === action.task.listId) {
          x.tasks = list2
        }
        return x
      })
      // console.log(state)
      return { ...state, lists: allLists }
    case UPDATE_PROJECT:
      return { ...state, ...action.project }
    case UPDATE_SINGLE_TASK:
      return { ...state, ...action.task }
    case UPDATE_SINGLE_LIST:
      return { ...state, ...action.list }
    default:
      return state
  }
}
