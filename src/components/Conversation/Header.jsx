import React from "react";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import { faker } from "@faker-js/faker";

import {  CaretDown, MagnifyingGlass, Phone, VideoCamera } from "phosphor-react";
import { Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import StyledBadge from "../../components/StyledBadge"
import { ToggleSidebar } from "../../redux/slices/app";
import { useDispatch } from "react-redux";



const Header = () => {
  const dispatch = useDispatch();

  const theme = useTheme();


  return (
    <Box
       p={2}
       width={"100%"}
        sx={{
          backgroundColor: theme.palette.mode ==='light' ?  "#F8FAFF" : theme.palette.background.default,
          boxShadow: "0px 0px 2px rgba(0,0,0,0.2)",
        }}
      >
        <Stack
          alignItems={"center"}
          direction={"row"}
          justifyContent={"space-between"}
          sx={{
            width: "100%",
            height: "100%",
          }}
        >
          <Stack onClick={() => {
              dispatch(ToggleSidebar());
            }} direction={"row"} spacing={2}>
            <Box>
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
              >
                <Avatar
                  src={faker.image.avatar()}
                  alt={faker.name.fullName()}
                />
              </StyledBadge>
            </Box>

            <Stack spacing={0.2}>
              <Typography variant="subtitle2">
                {faker.name.fullName()}
              </Typography>
              <Typography variant="caption">Online</Typography>
            </Stack>
          </Stack>

          <Stack direction={'row'} alignItems={'center'} spacing={3}>

            <IconButton>
                <VideoCamera/>
            </IconButton>
            <IconButton>
                <Phone/>
            </IconButton>
            <IconButton>
                <MagnifyingGlass/>
            </IconButton>

            <Divider orientation='vertical' flexItem/>
            <IconButton>
                <CaretDown/>
            </IconButton>

          </Stack>

        </Stack>
      </Box>
  )
}

export default Header