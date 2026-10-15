import { useTranslation } from 'react-i18next';
import { Typography } from "@heroui/react";

function SignUpForm() {
  const { t } = useTranslation();
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <Typography type="body">
        { t('auth:registrationUnavailable') }
      </Typography>
    </div>
  )
}

export default SignUpForm;
