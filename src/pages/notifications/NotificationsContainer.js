import React, { useState, useCallback } from "react";
import { withStyles } from "@material-ui/core";
import { toast } from "react-toastify";

import Notification from "../../components/Notification";
import NotificationsView from "./NotificationsView";

const positions = [
  toast.POSITION.TOP_LEFT,
  toast.POSITION.TOP_CENTER,
  toast.POSITION.TOP_RIGHT,
  toast.POSITION.BOTTOM_LEFT,
  toast.POSITION.BOTTOM_CENTER,
  toast.POSITION.BOTTOM_RIGHT
];

const NotificationsContainer = ({ classes }) => {
  const [notificationsPosition, setNotificationPosition] = useState(2);
  const [errorToastId, setErrorToastId] = useState(null);

  const sendNotification = useCallback((componentProps, options) => {
    return toast(
      <Notification
        {...componentProps}
        className={classes.notificationComponent}
      />,
      options
    );
  }, [classes.notificationComponent]);

  const retryErrorNotification = useCallback(() => {
    const componentProps = {
      type: "message",
      message: "Message was sent successfully!",
      variant: "contained",
      color: "success"
    };

    toast.update(errorToastId, {
      render: <Notification {...componentProps} />,
      type: "success"
    });
    setErrorToastId(null);
  }, [errorToastId]);

  const handleNotificationCall = useCallback((notificationType) => {
    let componentProps;

    if (errorToastId && notificationType === "error") return;

    switch (notificationType) {
      case "info":
        componentProps = {
          type: "feedback",
          message: "New user feedback received",
          variant: "contained",
          color: "primary"
        };
        break;
      case "error":
        componentProps = {
          type: "message",
          message: "Message was not sent!",
          variant: "contained",
          color: "secondary",
          extraButton: "Resend",
          extraButtonClick: retryErrorNotification
        };
        break;
      default:
        componentProps = {
          type: "shipped",
          message: "The item was shipped",
          variant: "contained",
          color: "success"
        };
    }

    const toastId = sendNotification(componentProps, {
      type: notificationType,
      position: positions[notificationsPosition],
      progressClassName: classes.progress,
      onClose:
        notificationType === "error" && (() => setErrorToastId(null)),
      className: classes.notification
    });

    if (notificationType === "error") setErrorToastId(toastId);
  }, [errorToastId, notificationsPosition, classes, sendNotification, retryErrorNotification]);

  const changeNotificationPosition = useCallback((positionId) => {
    setNotificationPosition(positionId);
  }, []);

  return (
    <NotificationsView
      notificationsPosition={notificationsPosition}
      errorToastId={errorToastId}
      sendNotification={sendNotification}
      retryErrorNotification={retryErrorNotification}
      handleNotificationCall={handleNotificationCall}
      changeNotificationPosition={changeNotificationPosition}
      classes={classes}
    />
  );
};

export default withStyles(theme => ({
  /*progress: {
    visibility: "hidden"
  },
  notification: {
    display: "flex",
    alignItems: "center",
    background: "transparent",
    boxShadow: "none",
    overflow: "visible"
  },
  notificationComponent: {
    paddingRight: theme.spacing(4)
  }*/
}))(NotificationsContainer);
