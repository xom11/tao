#!/bin/bash
SESSION="tao"
if tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux kill-session -t "$SESSION"
    echo "Stopped tmux session '$SESSION'"
else
    echo "Session '$SESSION' is not running"
fi
