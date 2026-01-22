create or replace function move_agent_subtree(
  _agent_id uuid,
  _new_parent_id uuid
) returns void as $$
declare
  _old_path text;
  _old_depth int;
  _new_parent_path text;
  _new_parent_depth int;
  _new_path text;
  _new_depth int;
  _depth_diff int;
begin
  -- 1. Get the current (old) details of the agent being moved
  select path, depth into _old_path, _old_depth
  from hierarchy_agents
  where user_id = _agent_id;

  if not found then
    raise exception 'Agent % not found', _agent_id;
  end if;

  -- 2. Get the details of the new parent (manager)
  select path, depth into _new_parent_path, _new_parent_depth
  from hierarchy_agents
  where user_id = _new_parent_id;

  if not found then
    raise exception 'New parent % not found', _new_parent_id;
  end if;

  -- 3. Check for circular reference (cannot move a parent under its own child)
  if _new_parent_path like _old_path || '.%' then
    raise exception 'Cannot move an agent under their own descendant.';
  end if;

  -- 4. Calculate new path and depth for the agent
  -- Format: parent_path.agent_id
  _new_path := _new_parent_path || '.' || replace(_agent_id::text, '-', '_');
  _new_depth := _new_parent_depth + 1;
  _depth_diff := _new_depth - _old_depth;

  -- 5. UPDATE the agent itself
  update hierarchy_agents
  set 
    parent_id = _new_parent_id,
    path = _new_path,
    depth = _new_depth,
    updated_at = now()
  where user_id = _agent_id;

  -- 6. UPDATE all descendants
  -- We replace the start of their path (_old_path) with the new start (_new_path)
  -- And we adjust their depth by the difference
  update hierarchy_agents
  set
    path = _new_path || substring(path from length(_old_path) + 1),
    depth = depth + _depth_diff,
    updated_at = now()
  where path like _old_path || '.%';

end;
$$ language plpgsql security definer set search_path = public;