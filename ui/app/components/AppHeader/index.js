import { Button, Grid, Hidden, Tooltip, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { Link, withRouter } from 'react-router-dom';
import { compose } from 'redux';
import agentsIcon from '../../images/agents-icon.svg';
import chatIcon from '../../images/chat-icon.svg';

import logo from '../../images/logo.svg';
import shareIcon from '../../images/share-icon.svg';

import ConversationBar from '../ConversationBar';
import gravatars from '../Gravatar';
import LanguageSelect from '../LanguageSelect';
import messages from './messages';

const styles = {
  root: {
    flexGrow: 1,
    backgroundColor: '#fbfcfd',
  },
  header: {
    padding: 17,
  },
  logo: {
    height: 45,
  },
  flex: {
    flex: 1,
  },
  agentsButtonContainer: {
    textAlign: 'center',
  },
  openChat: {
    float: 'right',
    marginLeft: '15px',
  },
  icon: {
    paddingRight: '5px',
  },
  link: {
    textDecoration: 'none',
  },
  notificationDot: {
    backgroundColor: '#Cb2121',
    height: '12px',
    width: '12px',
    borderRadius: '50%',
    position: 'absolute',
    right: '138px',
    top: '13px',
    zIndex: 999,
  },
  languageSelectContainer: {
    position: 'absolute',
    right: '350px',
    top: '20px',
  },
  agentIcon: {
    marginRight: '5px',
    height: '20px',
    position: 'relative',
    top: '3px',
  },
  agentName: {
    fontWeight: '500',
    fontSize: '16px',
  },
  shareIcon: {
    '&:hover': {
      filter: 'invert(0) !important',
    },
    filter: 'invert(1)',
    cursor: 'pointer',
    width: '15px',
    marginLeft: '5px',
    position: 'relative',
    top: '2px',
  },
};

/* eslint-disable react/prefer-stateless-function */
export class AppHeader extends React.Component {
  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({ time: Date.now() });
    }, 5000); // update the component every 10 seconds
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const { classes, intl, conversationBarOpen, chatButtonOpen, notifications, agent, demoMode, location, isConverseEnabled } = this.props;
    const { pathname } = location;

    let notificationDotColor = '#358fec';

    const isAgentNameHidden =
      pathname.indexOf('connection') === -1 &&
      pathname.indexOf('settings') === -1 &&
      pathname.indexOf('login') === -1 &&
      pathname.indexOf('users') === -1 &&
      pathname.indexOf('user') === -1 &&
      pathname.indexOf('demo') === -1 &&
      agent.gravatar !== '' &&
      pathname !== '/';

    const validNotifications = notifications.filter(notification => {
      if (notification.type === 'error') {
        notificationDotColor = '#cb2121';
        return true;
      }
      return (new Date() - notification.datetime) / 1000 < 10;
    });

    return conversationBarOpen ? (
      <Grid container className={classes.header} item xs={12}>
        <Hidden only={['xs', 'sm']}>
          <Grid className={classes.languageSelectContainer}>
            <LanguageSelect
              key="selectLanguage"
              uiLanguage={this.props.uiLanguage}
              uiLanguages={this.props.uiLanguages}
              onChangeLanguage={this.props.onChangeLanguage}
            />
          </Grid>
          <ConversationBar
            uiLanguage={this.props.uiLanguage}
            uiLanguages={this.props.uiLanguages}
            onChangeLanguage={this.props.onChangeLanguage}
            onToggleConversationBar={this.props.onToggleConversationBar}
            demoMode={demoMode}
          />
          <Grid item xl={2} lg={2} md={2}>
            {demoMode ? (
              <a href="https://spg.ai/projects/articulate/" target="_blank">
                <img className={classes.logo} src={logo} alt={intl.formatMessage(messages.articulateLogoAlt)} />
              </a>
            ) : (
                <Link
                  onClick={() => {
                    this.props.onToggleConversationBar(false);
                  }}
                  to={'/'}
                >
                  <img className={classes.logo} src={logo} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                </Link>
              )}
          </Grid>
          <Grid item xl={2} lg={2} md={2} />
          <Grid className={classes.agentsButtonContainer} item xl={2} lg={2} md={2}>
            {isAgentNameHidden ? (
              <Typography className={classes.agentName} style={{ color: agent.uiColor }}>
                {gravatars[agent.gravatar - 1]({
                  color: agent.uiColor,
                  className: classes.agentIcon,
                })}
                <span className={classes.agentName}>{agent.agentName}</span>
                <Tooltip title={intl.formatMessage(messages.shareAgent)} placement="bottom">
                  <img
                    src={shareIcon}
                    className={classes.shareIcon}
                    onClick={() => {
                      this.props.onShareAgent(agent.id);
                    }}
                  />
                </Tooltip>
              </Typography>
            ) : null}
          </Grid>
        </Hidden>
        <Hidden only={['md', 'lg', 'xl']}>
          {demoMode ? (
            <ConversationBar
              uiLanguage={this.props.uiLanguage}
              uiLanguages={this.props.uiLanguages}
              onChangeLanguage={this.props.onChangeLanguage}
              onToggleConversationBar={this.props.onToggleConversationBar}
              demoMode={demoMode}
            />
          ) : (
              <Fragment>
                <Grid className={classes.languageSelectContainer}>
                  <LanguageSelect
                    key="selectLanguage"
                    uiLanguage={this.props.uiLanguage}
                    uiLanguages={this.props.uiLanguages}
                    onChangeLanguage={this.props.onChangeLanguage}
                  />
                </Grid>
                <ConversationBar
                  uiLanguage={this.props.uiLanguage}
                  uiLanguages={this.props.uiLanguages}
                  onChangeLanguage={this.props.onChangeLanguage}
                  onToggleConversationBar={this.props.onToggleConversationBar}
                />
                <Grid item sm={6} xs={6}>
                  <Link
                    onClick={() => {
                      this.props.onToggleConversationBar(false);
                    }}
                    to="/"
                    className={classes.link}
                  >
                    <Button variant="contained">
                      <img className={classes.icon} src={agentsIcon} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                      <FormattedMessage {...messages.agentsButton} />
                    </Button>
                  </Link>
                </Grid>
                <Grid item sm={6} xs={6}>
                  <Button
                    onClick={() => {
                      this.props.onToggleConversationBar(true);
                    }}
                    color="primary"
                    variant="contained"
                    className={classes.openChat}
                  >
                    <img className={classes.icon} src={chatIcon} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                    <FormattedMessage {...messages.openChatButton} />
                  </Button>
                </Grid>
              </Fragment>
            )}
        </Hidden>
      </Grid>
    ) : (
        <Grid container className={classes.header} item xs={12}>
          <Hidden only={['xs', 'sm']}>
            <Grid item xl={2} lg={2} md={2}>
              {demoMode ? (
                <a href="https://spg.ai/projects/articulate/" target="_blank">
                  <img className={classes.logo} src={logo} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                </a>
              ) : (
                  <Link
                    onClick={() => {
                      this.props.onToggleConversationBar(false);
                    }}
                    to="/"
                  >
                    <img className={classes.logo} src={logo} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                  </Link>
                )}
            </Grid>
            <Grid item xl={3} lg={3} md={3} />
            <Grid className={classes.agentsButtonContainer} item xl={2} lg={2} md={2}>
              {isAgentNameHidden ? (
                <Typography className={classes.agentName} style={{ color: agent.uiColor }}>
                  {gravatars[agent.gravatar - 1]({
                    color: agent.uiColor,
                    className: classes.agentIcon,
                  })}
                  <span>{agent.agentName}</span>
                  <Tooltip title={intl.formatMessage(messages.shareAgent)} placement="bottom">
                    <img
                      src={shareIcon}
                      className={classes.shareIcon}
                      onClick={() => {
                        this.props.onShareAgent(agent.id);
                      }}
                    />
                  </Tooltip>
                </Typography>
              ) : null}
            </Grid>
            <Grid item xl={3} lg={3} md={3} />
            <Grid item xl={2} lg={2} md={2}>
              {pathname !== '/' ? (
                [
                  validNotifications.length > 0 && chatButtonOpen ? (
                    <div key="conversationNotificationDot" className={classes.notificationDot} style={{ backgroundColor: notificationDotColor }} />
                  ) : this.props.testTrainNotification ? (
                    <div key="conversationNotificationDot" className={classes.notificationDot} style={{ backgroundColor: '#358fec' }} />
                  ) : null,

                  chatButtonOpen && isConverseEnabled && (
                    <Button
                      key="conversat_button"
                      onClick={() => {
                        this.props.onToggleConversationBar(true);
                      }}
                      color="primary"
                      variant="contained"
                      className={classes.openChat}
                    >
                      <img className={classes.icon} src={chatIcon} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                      <FormattedMessage {...messages.openChatButton} />
                    </Button>
                  ),
                  <LanguageSelect
                    key="selectLanguage"
                    uiLanguage={this.props.uiLanguage}
                    uiLanguages={this.props.uiLanguages}
                    onChangeLanguage={this.props.onChangeLanguage}
                  />,
                ]
              ) : (
                  <LanguageSelect
                    key="selectLanguage"
                    uiLanguage={this.props.uiLanguage}
                    uiLanguages={this.props.uiLanguages}
                    onChangeLanguage={this.props.onChangeLanguage}
                  />
                )}
            </Grid>
          </Hidden>
          <Hidden only={['md', 'lg', 'xl']}>
            {demoMode ? (
              <Grid item xs={4}>
                <a href="https://spg.ai/projects/articulate/" target="_blank">
                  <img className={classes.logo} src={logo} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                </a>
              </Grid>
            ) : (
                <Grid item sm={6} xs={6}>
                  {isAgentNameHidden ? (
                    <Typography className={classes.agentName} style={{ color: agent.uiColor }}>
                      {gravatars[agent.gravatar - 1]({
                        color: agent.uiColor,
                        className: classes.agentIcon,
                      })}
                      <span className={classes.agentName}>{agent.agentName}</span>
                      <Tooltip title={intl.formatMessage(messages.shareAgent)} placement="bottom">
                        <img
                          src={shareIcon}
                          className={classes.shareIcon}
                          onClick={() => {
                            this.props.onShareAgent(agent.id);
                          }}
                        />
                      </Tooltip>
                    </Typography>
                  ) : null}
                </Grid>
              )}
            <Grid item xs={8}>
              {pathname !== '/' ? (
                [
                  validNotifications.length > 0 && chatButtonOpen ? (
                    <div key="conversationNotificationDot" className={classes.notificationDot} style={{ backgroundColor: notificationDotColor }} />
                  ) : this.props.testTrainNotification ? (
                    <div key="conversationNotificationDot" className={classes.notificationDot} style={{ backgroundColor: '#358fec' }} />
                  ) : null,
                  chatButtonOpen && isConverseEnabled && (
                    <Button
                      key="conversat_button"
                      onClick={() => {
                        this.props.onToggleConversationBar(true);
                      }}
                      color="primary"
                      variant="contained"
                      className={classes.openChat}
                      style={{ marginLeft: '15px' }}
                    >
                      <img className={classes.icon} src={chatIcon} alt={intl.formatMessage(messages.articulateLogoAlt)} />
                      <FormattedMessage {...messages.openChatButtonSmall} />
                    </Button>
                  ),
                  <LanguageSelect
                    key="selectLanguage"
                    uiLanguage={this.props.uiLanguage}
                    uiLanguages={this.props.uiLanguages}
                    onChangeLanguage={this.props.onChangeLanguage}
                  />,
                ]
              ) : (
                  <LanguageSelect
                    key="selectLanguage"
                    uiLanguage={this.props.uiLanguage}
                    uiLanguages={this.props.uiLanguages}
                    onChangeLanguage={this.props.onChangeLanguage}
                  />
                )}
            </Grid>
          </Hidden>
        </Grid>
      );
  }
}

AppHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
  conversationBarOpen: PropTypes.bool,
  onToggleConversationBar: PropTypes.func,
  chatButtonOpen: PropTypes.bool,
  onShowChatButton: PropTypes.func,
  notifications: PropTypes.array,
  uiLanguages: PropTypes.array,
  uiLanguage: PropTypes.string,
  onChangeLanguage: PropTypes.func,
  agent: PropTypes.object,
  demoMode: PropTypes.bool,
  onShareAgent: PropTypes.func,
  isConverseEnabled: PropTypes.bool,
};

const withDefinedStyles = withStyles(styles);

export default compose(
  withRouter,
  withDefinedStyles,
  injectIntl,
)(AppHeader);
