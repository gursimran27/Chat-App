import { useState } from 'react';
import * as Yup from 'yup';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { Stack, IconButton, InputAdornment, Button } from '@mui/material';
// components
import FormProvider, { RHFTextField } from '../../components/hook-form';
import { Eye, EyeSlash } from 'phosphor-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { NewPassword } from '../../redux/slices/auth';
import { LoadingButton } from '@mui/lab';

// ----------------------------------------------------------------------

export default function NewPasswordForm() {
  const { isLoading } = useSelector((state)=>state.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const [queryParameters] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const VerifyCodeSchema = Yup.object().shape({
    
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    passwordConfirm: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('password'), null], 'Passwords must match'),
  });

  const defaultValues = {
    password: '',
    passwordConfirm: '',
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(VerifyCodeSchema),
    defaultValues,
  });

  const {
    handleSubmit,
  } = methods;

  const onSubmit = async (data) => {
    try {
        console.log(data);
    //   Send API Request
    dispatch(NewPassword({...data, token: queryParameters.get('token')},navigate));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        

        <RHFTextField
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <Eye /> : <EyeSlash />}
                  </IconButton>
                </InputAdornment>
              ),
          }}
        />

        <RHFTextField
          name="passwordConfirm"
          label="Confirm New Password"
          type={showPassword2 ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword2(!showPassword2)}
                    edge="end"
                  >
                    {showPassword2 ? <Eye /> : <EyeSlash />}
                  </IconButton>
                </InputAdornment>
              ),
          }}
        />

<LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isLoading}
        // loadingIndicator="Loading…"
        loadingPosition="end"
        disabled={isLoading?true:false}
        sx={{
          bgcolor: "text.primary",
          color: (theme) =>
            theme.palette.mode === "light" ? "common.white" : "grey.800",
          "&:hover": {
            bgcolor: "text.primary",
            color: (theme) =>
              theme.palette.mode === "light" ? "common.white" : "grey.800",
          },
        }}
      >
        <span>{!isLoading ? 'Update Password' : "Loading..."}</span>
      </LoadingButton>
      </Stack>
    </FormProvider>
  );
}