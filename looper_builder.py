# TODO: Probably better for this to be ansible.
# 1. Checkout the rpo
# Install nvm
# nvm install node
# npm install


import os
import subprocess
import time
from datetime import datetime

# Change the working directory to the script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)


def run_command(command):
    try:
        # Run the command and check for errors
        result = subprocess.run(command, check=True, text=True, capture_output=True)
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        print(e.stderr)


# Git operations
commands = [
    ["/usr/bin/git", "remote", "update"],
    ["/usr/bin/git", "checkout", "production"],
    ["/usr/bin/git", "reset", "--hard", "origin/production"],
    ["/root/.nvm/versions/node/v22.6.0/bin/npm", "install"],
    ["/root/.nvm/versions/node/v22.6.0/bin/npm", "run", "build"],
    ["/usr/bin/rsync", "-vah", "--progress", "--delete",
     "/root/projects/justinholmes.com/justinholmes.com.public.dist/",
     "jmyles_justinholmescom@ssh.nyc1.nearlyfreespeech.net:"]
]

while True:
    for command in commands:
        # Log the time and the command to be executed
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{current_time}] Running command: {' '.join(command)}")

        run_command(command)
    print("Sleeping for 60 seconds...")
    time.sleep(60)
