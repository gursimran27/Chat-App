import React from "react";
import { useTheme } from "@mui/material/styles";

import { Box, Divider, IconButton, Stack } from "@mui/material";
import MaterialUISwitch from "../../components/MaterialUISwitch";

import Logo from "../../assets/Images/logo.ico";

import useSettings from "../../hooks/useSettings";
import { Nav_Buttons, Nav_Setting } from "../../data";

import ProfileMenu from "./ProfileMenu";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { UpdateTab } from "../../redux/slices/app";
import { ToggleTheme } from "../../redux/slices/theme";

const getPath = (index) => {
  switch (index) {
    case 0:
      return "/app#loaded";

    case 1:
      return "/group#loaded";

    case 2:
      return "/call#loaded";

    case 3:
      return "/settings#loaded";

    default:
      break;
  }
};

const SideBar = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { tab } = useSelector((state) => state.app);

  const navigate = useNavigate();

  const { onToggleMode } = useSettings();

  const selectedTab = tab;
  // console.log(selectedTab);

  const handleChangeTab = (index) => {
    dispatch(UpdateTab({ tab: index }));
    navigate(getPath(index));
  };

  // const mode = useSelector((state) => state.theme.theme);

  return (
    <Box
      sx={{
        height: "100vh",
        width: 100,

        backgroundColor:
          theme.palette.mode === "light"
            ? "#F0F4FA"
            : theme.palette.background.paper,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Stack
        py={3}
        alignItems={"center"}
        justifyContent="space-between"
        sx={{ height: "100%" }}
      >
        <Stack alignItems={"center"} spacing={4}>
          <Box
            sx={{
              height: 64,
              width: 64,
              borderRadius: 1.5,
              backgroundColor: theme.palette.primary.main,
            }}
            p={1}
          >
            <img src={Logo} alt="Tawk" />
          </Box>
          <Stack
            sx={{ width: "max-content" }}
            direction="column"
            alignItems={"center"}
            spacing={3}
          >
            {Nav_Buttons.map((el) => {
              return el.index == selectedTab ? (
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 1.5,
                  }}
                  p={1}
                >
                  <IconButton
                    onClick={() => {
                      handleChangeTab(el.index);
                    }}
                    sx={{ width: "max-content", color: "#ffffff" }}
                  >
                    {el.icon}
                  </IconButton>
                </Box>
              ) : (
                <IconButton
                  onClick={() => {
                    handleChangeTab(el.index);
                  }}
                  sx={{
                    width: "max-content",
                    color:
                      theme.palette.mode === "light"
                        ? "#080707"
                        : theme.palette.text.primary,
                  }}
                >
                  {el.icon}
                </IconButton>
              );
            })}
            <Divider sx={{ width: 48 }} />
            {Nav_Setting.map((el) => {
              return el.index == selectedTab ? (
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 1.5,
                  }}
                  p={1}
                >
                  <IconButton
                    onClick={() => {
                      handleChangeTab(el.index);
                    }}
                    sx={{ width: "max-content", color: "#ffffff" }}
                  >
                    {el.icon}
                  </IconButton>
                </Box>
              ) : (
                <IconButton
                  onClick={() => {
                    handleChangeTab(el.index);

                    // dispatch(UpdateTab(el.index));
                  }}
                  sx={{
                    width: "max-content",
                    color:
                      theme.palette.mode === "light"
                        ? "#080707"
                        : theme.palette.text.primary,
                  }}
                >
                  {el.icon}
                </IconButton>
              );
            })}
          </Stack>
        </Stack>
        <Stack spacing={4}>
          {/* switch */}
          <MaterialUISwitch
            checked={theme.palette.mode === "dark"}
            onChange={() => {
              onToggleMode();
              dispatch(ToggleTheme());
            }}
          />
          {/* Profile Menu */}
          <ProfileMenu />
        </Stack>
      </Stack>
    </Box>
  );
};

export default SideBar;
