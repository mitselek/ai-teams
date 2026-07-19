# ai-team container -- minimal fleet pattern (mvox, screenwerk)
# ubuntu 24.04 + node 22 + claude code + sshd (key-only) + tmux
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
        git jq curl wget ca-certificates openssh-server tmux gosu \
        locales tzdata sudo python3 procps \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i 's/# en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && locale-gen \
    && ln -snf /usr/share/zoneinfo/Europe/Tallinn /etc/localtime \
    && echo "Europe/Tallinn" > /etc/timezone

# gh CLI (binary install, no apt source to go stale)
RUN GH_VER=$(curl -fsSL https://api.github.com/repos/cli/cli/releases/latest | jq -r .tag_name | tr -d v) \
    && curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_VER}/gh_${GH_VER}_linux_amd64.tar.gz" \
       | tar -xz -C /usr/local --strip-components=1

# node 22 LTS (binary)
RUN curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz \
       -o /tmp/node.tar.gz \
    && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.gz && node --version

RUN npm install -g @anthropic-ai/claude-code 2>&1 | tail -2

# user ai-teams uid/gid 1000 (rename stock ubuntu user)
RUN groupmod -n ai-teams ubuntu \
    && usermod -l ai-teams -d /home/ai-teams -m ubuntu \
    && usermod -p '*' ai-teams \
    && mkdir -p /home/ai-teams/.ssh \
    && chmod 700 /home/ai-teams/.ssh \
    && chown -R 1000:1000 /home/ai-teams

# sshd: key-only, no root, no passwords
RUN mkdir -p /run/sshd && ssh-keygen -A \
    && sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/'          /etc/ssh/sshd_config \
    && sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?KbdInteractiveAuthentication.*/KbdInteractiveAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?UsePAM.*/UsePAM no/'                            /etc/ssh/sshd_config

ENV HOME=/home/ai-teams
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
COPY entrypoint.sh /entrypoint.sh
COPY up /usr/local/bin/up
RUN chmod +x /entrypoint.sh /usr/local/bin/up
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/sbin/sshd", "-D", "-e"]
