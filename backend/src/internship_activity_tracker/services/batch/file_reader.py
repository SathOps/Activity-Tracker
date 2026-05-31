"""File reading utilities for GitLab projects."""


def read_file_content_no_cache(project, file_path, ref):
    """Read file content from a GitLab project without caching.

    Args:
        project: GitLab project object
        file_path: Path to file in repository
        ref: Branch/tag reference

    Returns:
        File content as string, or None if file not found/error
    """
    try:
        file = project.files.get(file_path=file_path, ref=ref)
        return file.decode().decode("utf-8")
    except Exception:
        return None


def read_file_content(project, file_path, ref):
    """Read file content from a GitLab project.

    Args:
        project: GitLab project object
        file_path: Path to file in repository
        ref: Branch/tag reference

    Returns:
        File content as string, or None if file not found/error
    """
    return read_file_content_no_cache(project, file_path, ref)
