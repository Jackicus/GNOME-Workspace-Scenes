# Workspace Scenes's own dev.sh commands, sourced by the kit's scripts/dev.sh.
#
#   ./scripts/dev.sh shaders    compile every scene's shader with glslangValidator in
#                               each GLSL dialect Cogl may hand it to (part of 'check')
#

# A shader mistake is silent in the shell (the scene draws black); here it names the
# line. Needs no shell, display or GPU, so CI runs it.
cmd_shaders() {
    require node
    require glslangValidator
    node "$REPO_DIR/scripts/shaders.mjs"
}
