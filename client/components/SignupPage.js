import React, { useState } from "react"
import { connect } from "react-redux"
import { authenticate } from "../store"
import { createUserThunk } from "../store/singleUser"
import {
  Flex,
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
} from "@chakra-ui/react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { Link } from "react-router-dom"

/**
 * COMPONENT
 */
const Signup = (props) => {
  const { register } = useForm()
  // const { username, email, address, displayName, handleSubmit, error } = props

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    address: "",
  })
  const dispatch = useDispatch()
  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      dispatch(createUserThunk(form))
    } catch (err) {}
    props.history.push("/login")
  }

  return (
    <div>
      <Flex width="full" align="center" justifyContent="center">
        <Box
          p={8}
          maxWidth="500px"
          borderWidth={1}
          borderRadius={8}
          boxShadow="lg"
        >
          <Box textAlign="center">
            <Heading>Sign Up</Heading>
          </Box>
          <Box my={4} textAlign="left">
            <form onSubmit={handleSubmit} name="signupForm">
              <FormControl>
                <FormLabel>Username</FormLabel>
                <Input
                  type="username"
                  placeholder="username"
                  value={form.username}
                  {...register("username")}
                  onChange={handleChange}
                  isRequired={true}
                />
              </FormControl>
              <FormControl mt={6}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="*******"
                  {...register("password")}
                  value={form.password}
                  onChange={handleChange}
                  isRequired={true}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="email"
                  value={form.email}
                  {...register("email")}
                  onChange={handleChange}
                  isRequired={true}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input
                  type="address"
                  placeholder="address"
                  value={form.address}
                  {...register("address")}
                  onChange={handleChange}
                />
              </FormControl>
              <Button
                type="submit"
                variantcolor="teal"
                variant="outline"
                width="full"
                mt={4}
              >
                Sign Up
              </Button>
              <Button>
                <Link to="/home">Cancel</Link>
              </Button>
            </form>
          </Box>
        </Box>
      </Flex>
    </div>
  )
}

export default Signup
